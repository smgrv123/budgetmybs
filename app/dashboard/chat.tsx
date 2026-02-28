import type { ChatMessage } from '@/db/schema-types';
import { ChatActionStatusEnum, ChatIntentEnum, ChatRoleEnum } from '@/db/types';
import { ChatBubble, ChatHeader, ChatInput, InlineExpenseForm, InlineProfileUpdate } from '@/src/components/chat';
import type { UpdatableIntent } from '@/src/components/chat/inlineProfileUpdate';
import { BSafeAreaView } from '@/src/components/ui';
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
import type { ChatExpenseData } from '@/src/types/chat';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, type ViewStyle } from 'react-native';

// Module-level flag: ensures welcome fires only once per JS session,
// even if the user navigates away and back to the chat tab.
let welcomeSentThisSession = false;

// ── Types ─────────────────────────────────────────────────────────────────────

/** A pending inline action attached to a specific message. */
type PendingAction =
  | { kind: 'expense'; messageId: string; data: ChatExpenseData }
  | { kind: 'update'; messageId: string; payload: UpdatableIntent };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { profile } = useProfile();
  const { fixedExpenses } = useFixedExpenses();
  const { debts } = useDebts();
  const { savingsGoals } = useSavingsGoals();
  const { allCategories } = useCategories();
  const { createExpenseAsync } = useExpenses();
  const { upsertProfile } = useProfile();
  const { createFixedExpenseAsync, updateFixedExpenseAsync, fixedExpenses: allFixedExpenses } = useFixedExpenses();
  const { createDebtAsync, updateDebtAsync, debts: allDebts } = useDebts();
  const { createSavingsGoalAsync, updateSavingsGoalAsync, savingsGoals: allSavingsGoals } = useSavingsGoals();

  const { messages, isMessagesLoading, sendMessageAsync, updateActionAsync, clearHistoryAsync } = useChat();

  // ── Local state ───────────────────────────────────────────────────────────

  const [isSending, setIsSending] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // ── Session welcome ───────────────────────────────────────────────────────
  // Uses a module-level flag so the welcome is shown exactly once per JS
  // session regardless of how many times the user navigates to this tab.

  useEffect(() => {
    if (!isMessagesLoading && messages.length === 0 && !welcomeSentThisSession) {
      welcomeSentThisSession = true;
      sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: `Hey ${profile?.name ?? 'there'}! 👋 I'm FinAI, your personal finance assistant. I can help you track expenses, update your financial details, or just answer money questions. What's on your mind?`,
      }).catch(console.error);
    }
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
      // 1. Save user message to DB
      await sendMessageAsync({
        role: ChatRoleEnum.USER,
        content: text,
        quotedMessageId: quotedMessage?.id ?? null,
      });

      // 2. Build context for Gemini
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

      // 3. Call Gemini
      const response = await sendChatMessage(text, context);

      // 4. Determine if this requires a pending action
      const requiresAction = response.intent !== ChatIntentEnum.GENERAL;
      const actionStatus = requiresAction ? ChatActionStatusEnum.PENDING : undefined;

      // 5. Save assistant message to DB
      const assistantMsg = await sendMessageAsync({
        role: ChatRoleEnum.ASSISTANT,
        content: response.message,
        actionType: requiresAction ? (response.intent as any) : undefined,
        actionData: response.data ? (response.data as Record<string, unknown>) : undefined,
        actionStatus,
      });

      // 6. Surface inline form for actionable intents
      if (requiresAction && response.data && assistantMsg) {
        switch (response.intent) {
          case ChatIntentEnum.ADD_EXPENSE:
            setPendingAction({ kind: 'expense', messageId: assistantMsg.id, data: response.data as ChatExpenseData });
            break;
          case ChatIntentEnum.UPDATE_PROFILE:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: ChatIntentEnum.UPDATE_PROFILE, data: response.data as any },
            });
            break;
          case ChatIntentEnum.ADD_FIXED_EXPENSE:
          case ChatIntentEnum.UPDATE_FIXED_EXPENSE:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent as any, data: response.data as any },
            });
            break;
          case ChatIntentEnum.ADD_DEBT:
          case ChatIntentEnum.UPDATE_DEBT:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent as any, data: response.data as any },
            });
            break;
          case ChatIntentEnum.ADD_SAVINGS_GOAL:
          case ChatIntentEnum.UPDATE_SAVINGS_GOAL:
            setPendingAction({
              kind: 'update',
              messageId: assistantMsg.id,
              payload: { intent: response.intent as any, data: response.data as any },
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
      // Note: createExpenseAsync (from useExpenses) already invalidates
      // EXPENSES_QUERY_KEY and TOTAL_SPENT_QUERY_KEY in its onSuccess.
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
          upsertProfile({
            name: profile!.name,
            salary: profile!.salary,
            monthlySavingsTarget: profile!.monthlySavingsTarget,
            frivolousBudget: profile!.frivolousBudget,
            debtPayoffPreference: profile!.debtPayoffPreference ?? 'avalanche',
            [(payload.data as any).field]: parseFloat(values['value'] ?? '0'),
          } as any);
          break;
        case ChatIntentEnum.ADD_FIXED_EXPENSE:
          await createFixedExpenseAsync({
            name: values['name']!,
            type: (payload.data as any).type,
            amount: parseFloat(values['amount'] ?? '0'),
          });
          break;
        case ChatIntentEnum.UPDATE_FIXED_EXPENSE: {
          const match = allFixedExpenses.find(
            (fe) => fe.name === (payload.data as any).existingName || fe.name === values['name']
          );
          if (match)
            await updateFixedExpenseAsync({ id: match.id, data: { amount: parseFloat(values['amount'] ?? '0') } });
          break;
        }
        case ChatIntentEnum.ADD_DEBT:
          await createDebtAsync({
            name: values['name']!,
            type: (payload.data as any).type,
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
          const match = allDebts.find(
            (d) => d.name === (payload.data as any).existingName || d.name === values['name']
          );
          if (match)
            await updateDebtAsync({ id: match.id, data: { emiAmount: parseFloat(values['emiAmount'] ?? '0') } });
          break;
        }
        case ChatIntentEnum.ADD_SAVINGS_GOAL:
          await createSavingsGoalAsync({
            name: values['name']!,
            type: (payload.data as any).type,
            targetAmount: parseFloat(values['targetAmount'] ?? '0'),
          });
          break;
        case ChatIntentEnum.UPDATE_SAVINGS_GOAL: {
          const match = allSavingsGoals.find(
            (g) => g.name === (payload.data as any).existingName || g.name === values['name']
          );
          if (match)
            await updateSavingsGoalAsync({
              id: match.id,
              data: { targetAmount: parseFloat(values['targetAmount'] ?? '0') },
            });
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
          welcomeSentThisSession = false;
        },
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const quoted = item.quotedMessageId ? (messages.find((m) => m.id === item.quotedMessageId) ?? null) : null;
    return <ChatBubble message={item} quotedMessage={quoted} />;
  };

  return (
    <BSafeAreaView edges={['top']}>
      <ChatHeader onClearHistory={handleClearHistory} />

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

      {/* Inline action forms */}
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

      <ChatInput
        onSend={handleSend}
        isSending={isSending}
        quotedMessage={quotedMessage}
        onClearQuote={() => setQuotedMessage(null)}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create<{ list: ViewStyle; listContent: ViewStyle }>({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});
