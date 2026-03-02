import type { ChatMessage } from '@/db/schema-types';
import { ChatActionStatusEnum, ChatIntentEnum, ChatRoleEnum } from '@/db/types';
import {
  ChatBubble,
  ChatHeader,
  ChatInput,
  InlineDeleteConfirm,
  InlineExpenseForm,
  InlineProfileUpdate,
} from '@/src/components/chat';
import type { UpdatableIntent } from '@/src/components/chat/inlineProfileUpdate';
import { BSafeAreaView } from '@/src/components/ui';
import type { DeleteEntityTypeValue } from '@/src/constants/chat';
import { DeleteEntityType } from '@/src/constants/chat';
import { Spacing } from '@/src/constants/theme';
import {
  useCategories,
  useChat,
  useDebts,
  useExpenses,
  useFixedExpenses,
  useProfile,
  useSavingsGoals,
} from '@/src/hooks';
import { sendChatMessage } from '@/src/services/chatService';
import type { ChatDeleteData, ChatExpenseData } from '@/src/types/chat';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingAction =
  | { kind: 'expense'; messageId: string; data: ChatExpenseData }
  | { kind: 'update'; messageId: string; payload: UpdatableIntent }
  | { kind: 'delete'; messageId: string; entityType: DeleteEntityTypeValue; data: ChatDeleteData };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);

  // ── Data (each hook called exactly once) ──────────────────────────────────

  const { profile, upsertProfileAsync } = useProfile();

  const { allCategories } = useCategories();
  const { createExpenseAsync } = useExpenses();

  const { fixedExpenses, createFixedExpenseAsync, updateFixedExpenseAsync, removeFixedExpenseAsync } =
    useFixedExpenses();

  const { debts, createDebtAsync, updateDebtAsync, removeDebtAsync } = useDebts();

  const { savingsGoals, createSavingsGoalAsync, updateSavingsGoalAsync, removeSavingsGoalAsync } = useSavingsGoals();

  const { messages, isMessagesLoading, sendMessageAsync, updateActionAsync, clearHistoryAsync } = useChat();

  // ── Local state ───────────────────────────────────────────────────────────

  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Tracks whether the welcome message has been sent for this screen instance.
  // useRef (not module-level) so it resets on remount but doesn't cause re-renders.
  const welcomeSentRef = useRef(false);

  // ── Session welcome ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isMessagesLoading) return;
    // If messages exist, mark welcomed so we never double-send
    if (messages.length > 0) {
      welcomeSentRef.current = true;
      return;
    }
    if (welcomeSentRef.current) return;
    welcomeSentRef.current = true;
    sendMessageAsync({
      role: ChatRoleEnum.ASSISTANT,
      content: `Hey ${profile?.name ?? 'there'}! 👋 I'm FinAI, your personal finance assistant. I can help you track expenses, update your financial details, or just answer money questions. What's on your mind?`,
    }).catch(console.error);
  }, [isMessagesLoading, messages.length, profile?.name, sendMessageAsync]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ── Send handler ──────────────────────────────────────────────────────────

  const handleSend = async (text: string) => {
    if (!profile) return;

    setIsSending(true);
    setQuotedMessage(null);

    try {
      await sendMessageAsync({
        role: ChatRoleEnum.USER,
        content: text,
        quotedMessageId: quotedMessage?.id ?? null,
      });

      const context = {
        profile: {
          name: profile.name,
          salary: profile.salary,
          monthlySavingsTarget: profile.monthlySavingsTarget,
          frivolousBudget: profile.frivolousBudget,
          debtPayoffPreference: profile.debtPayoffPreference ?? 'avalanche',
        },
        fixedExpenses,
        debts,
        savingsGoals,
        categoryNames: allCategories.map((c) => c.name),
      };

      const response = await sendChatMessage(text, context);

      const requiresAction = response.intent !== ChatIntentEnum.GENERAL;
      const actionStatus = requiresAction ? ChatActionStatusEnum.PENDING : undefined;

      const assistantMsg = await sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: response.message,
        actionType: requiresAction ? response.intent : undefined,
        actionData: response.data ? (response.data as Record<string, unknown>) : undefined,
        actionStatus,
      });

      if (requiresAction && assistantMsg) {
        switch (response.intent) {
          case ChatIntentEnum.ADD_EXPENSE:
            setPendingAction({ kind: 'expense', messageId: assistantMsg.id, data: response.data });
            break;
          case ChatIntentEnum.UPDATE_PROFILE:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: ChatIntentEnum.UPDATE_PROFILE, data: response.data },
            });
            break;
          case ChatIntentEnum.ADD_FIXED_EXPENSE:
          case ChatIntentEnum.UPDATE_FIXED_EXPENSE:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent, data: response.data },
            });
            break;
          case ChatIntentEnum.DELETE_FIXED_EXPENSE:
            setPendingAction({
              kind: 'delete',
              messageId: assistantMsg.id,
              entityType: DeleteEntityType.FIXED_EXPENSE,
              data: response.data,
            });
            break;
          case ChatIntentEnum.ADD_DEBT:
          case ChatIntentEnum.UPDATE_DEBT:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent, data: response.data },
            });
            break;
          case ChatIntentEnum.DELETE_DEBT:
            setPendingAction({
              kind: 'delete',
              messageId: assistantMsg.id,
              entityType: DeleteEntityType.DEBT,
              data: response.data,
            });
            break;
          case ChatIntentEnum.ADD_SAVINGS_GOAL:
          case ChatIntentEnum.UPDATE_SAVINGS_GOAL:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent, data: response.data },
            });
            break;
          case ChatIntentEnum.DELETE_SAVINGS_GOAL:
            setPendingAction({
              kind: 'delete',
              messageId: assistantMsg.id,
              entityType: DeleteEntityType.SAVINGS_GOAL,
              data: response.data,
            });
            break;
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      await sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Sorry, I ran into an issue. Please try again in a moment.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // ── Action confirmation handlers ──────────────────────────────────────────

  const handleExpenseConfirm = async (data: ChatExpenseData & { categoryId?: string }) => {
    if (!pendingAction) return;
    try {
      await createExpenseAsync({
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description,
        wasImpulse: 0,
      });
      await updateActionAsync({ id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.COMPLETED });
      await sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: `✅ Expense of ₹${data.amount.toLocaleString('en-IN')} added successfully!`,
      });
    } catch {
      await sendMessageAsync({ role: ChatRoleEnum.ASSISTANT, content: "Couldn't save the expense. Please try again." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateConfirm = async (values: Record<string, string>) => {
    if (!pendingAction || pendingAction.kind !== 'update') return;
    const { payload, messageId } = pendingAction;

    try {
      switch (payload.intent) {
        case ChatIntentEnum.UPDATE_PROFILE:
          await upsertProfileAsync({
            name: profile!.name,
            salary: profile!.salary,
            monthlySavingsTarget: profile!.monthlySavingsTarget,
            frivolousBudget: profile!.frivolousBudget,
            debtPayoffPreference: profile!.debtPayoffPreference ?? 'avalanche',
            [payload.data.field]: parseFloat(values['value'] ?? '0'),
          });
          break;
        case ChatIntentEnum.ADD_FIXED_EXPENSE:
          await createFixedExpenseAsync({
            name: values['name']!,
            type: payload.data.type!,
            amount: parseFloat(values['amount'] ?? '0'),
          });
          break;
        case ChatIntentEnum.UPDATE_FIXED_EXPENSE: {
          const match = fixedExpenses.find((fe) => fe.name === payload.data.existingName);
          if (match) {
            await updateFixedExpenseAsync({
              id: match.id,
              data: {
                ...(values['name'] && { name: values['name'] }),
                amount: parseFloat(values['amount'] ?? '0'),
              },
            });
          }
          break;
        }
        case ChatIntentEnum.ADD_DEBT:
          await createDebtAsync({
            name: values['name']!,
            type: payload.data.type!,
            principal: parseFloat(values['principal'] ?? '0'),
            interestRate: parseFloat(values['interestRate'] ?? '0'),
            emiAmount: parseFloat(values['emiAmount'] ?? '0'),
            tenureMonths: parseInt(values['tenureMonths'] ?? '0', 10),
            remaining: parseFloat(values['principal'] ?? '0'),
            remainingMonths: parseInt(values['tenureMonths'] ?? '0', 10),
            customType: null,
            startDate: null,
          });
          break;
        case ChatIntentEnum.UPDATE_DEBT: {
          const match = debts.find((d) => d.name === payload.data.existingName);
          if (match) {
            await updateDebtAsync({
              id: match.id,
              data: {
                ...(values['name'] && { name: values['name'] }),
                ...(values['principal'] && { principal: parseFloat(values['principal']) }),
                ...(values['interestRate'] && { interestRate: parseFloat(values['interestRate']) }),
                ...(values['emiAmount'] && { emiAmount: parseFloat(values['emiAmount']) }),
                ...(values['tenureMonths'] && { tenureMonths: parseInt(values['tenureMonths'], 10) }),
              },
            });
          }
          break;
        }
        case ChatIntentEnum.ADD_SAVINGS_GOAL:
          await createSavingsGoalAsync({
            name: values['name']!,
            type: payload.data.type!,
            targetAmount: parseFloat(values['targetAmount'] ?? '0'),
          });
          break;
        case ChatIntentEnum.UPDATE_SAVINGS_GOAL: {
          const match = savingsGoals.find((g) => g.name === payload.data.existingName);
          if (match) {
            await updateSavingsGoalAsync({
              id: match.id,
              data: {
                ...(values['name'] && { name: values['name'] }),
                targetAmount: parseFloat(values['targetAmount'] ?? '0'),
              },
            });
          }
          break;
        }
      }
      await updateActionAsync({ id: messageId, actionStatus: ChatActionStatusEnum.COMPLETED });
      await sendMessageAsync({ role: ChatRoleEnum.ASSISTANT, content: '✅ Done! Your data has been updated.' });
    } catch {
      await sendMessageAsync({ role: ChatRoleEnum.ASSISTANT, content: "Couldn't save the changes. Please try again." });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingAction || pendingAction.kind !== 'delete') return;
    const { data, entityType, messageId } = pendingAction;

    setIsDeleting(true);
    try {
      switch (entityType) {
        case DeleteEntityType.FIXED_EXPENSE: {
          const match = fixedExpenses.find((fe) => fe.name === data.existingName);
          if (match) await removeFixedExpenseAsync(match.id);
          break;
        }
        case DeleteEntityType.DEBT: {
          const match = debts.find((d) => d.name === data.existingName);
          if (match) await removeDebtAsync(match.id);
          break;
        }
        case DeleteEntityType.SAVINGS_GOAL: {
          const match = savingsGoals.find((g) => g.name === data.existingName);
          if (match) await removeSavingsGoalAsync(match.id);
          break;
        }
      }
      await updateActionAsync({ id: messageId, actionStatus: ChatActionStatusEnum.COMPLETED });
      await sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: `✅ ${data.existingName} has been deleted.`,
      });
    } catch {
      await sendMessageAsync({ role: ChatRoleEnum.ASSISTANT, content: "Couldn't delete. Please try again." });
    } finally {
      setIsDeleting(false);
      setPendingAction(null);
    }
  };

  const handleActionCancel = async () => {
    if (!pendingAction) return;
    await updateActionAsync({ id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.CANCELLED }).catch(
      console.error
    );
    setPendingAction(null);
  };

  // ── Clear history ──────────────────────────────────────────────────────────

  const handleClearHistory = () => {
    Alert.alert('Clear Chat History', 'This will permanently delete all messages. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistoryAsync().catch(console.error);
          welcomeSentRef.current = false;
        },
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const quoted = item.quotedMessageId ? (messages.find((m) => m.id === item.quotedMessageId) ?? null) : null;
    return <ChatBubble message={item} quotedMessage={quoted} onQuote={setQuotedMessage} />;
  };

  return (
    <BSafeAreaView edges={['top']}>
      <ChatHeader onClearHistory={handleClearHistory} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {pendingAction?.kind === 'expense' && (
          <InlineExpenseForm
            initialData={pendingAction.data}
            onSubmit={handleExpenseConfirm}
            onCancel={handleActionCancel}
            isSubmitting={isSending}
          />
        )}
        {pendingAction?.kind === 'update' && (
          <InlineProfileUpdate
            payload={pendingAction.payload}
            onSubmit={handleUpdateConfirm}
            onCancel={handleActionCancel}
            isSubmitting={isSending}
          />
        )}
        {pendingAction?.kind === 'delete' && (
          <InlineDeleteConfirm
            entityName={pendingAction.data.existingName}
            entityType={pendingAction.entityType}
            onConfirm={handleDeleteConfirm}
            onCancel={handleActionCancel}
            isDeleting={isDeleting}
          />
        )}

        <ChatInput
          onSend={handleSend}
          isSending={isSending}
          quotedMessage={quotedMessage}
          onClearQuote={() => setQuotedMessage(null)}
        />
      </KeyboardAvoidingView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
  },
});
