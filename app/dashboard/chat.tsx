import type { ChatMessage } from '@/db/schema-types';
import {
  ChatActionStatusEnum,
  ChatIntentEnum,
  ChatRoleEnum,
  CreditCardTxnTypeEnum,
  DebtPayoffPreferenceEnum,
} from '@/db/types';
import {
  ChatBubble,
  ChatHeader,
  ChatInput,
  InlineDeleteConfirm,
  InlineExpenseForm,
  InlineIncomeForm,
  InlineProfileUpdate,
  InlineSavingsForm,
} from '@/src/components/chat';
import type { UpdatableIntent } from '@/src/components/chat/inlineProfileUpdate';
import { BButton, BIcon, BSafeAreaView, BText, BView } from '@/src/components/ui';
import type { DeleteEntityTypeValue } from '@/src/constants/chat';
import {
  CHAT_ALERT_STRINGS,
  CHAT_LOG_STRINGS,
  CHAT_MESSAGE_STRINGS,
  CHAT_STRINGS,
  DebtFieldKey,
  DeleteEntityType,
  FixedExpenseFieldKey,
  ProfileUpdateFieldKey,
  SavingsGoalFieldKey,
} from '@/src/constants/chat';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  ADHOC_SAVINGS_BALANCES_QUERY_KEY,
  MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
  SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
  SAVINGS_GOALS_QUERY_KEY,
  useCategories,
  useChat,
  useCreditCards,
  useDebts,
  useExpenses,
  useFixedExpenses,
  useIncome,
  useProfile,
  useSavingsGoals,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { sendChatMessage } from '@/src/services/chatService';
import type { ChatDeleteData, ChatExpenseData, ChatIncomeData, ChatSavingsData } from '@/src/types/chat';
import { checkNetworkConnection, NetworkError } from '@/src/utils/network';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingAction =
  | { kind: 'expense'; messageId: string; data: ChatExpenseData }
  | { kind: 'income'; messageId: string; data: ChatIncomeData }
  | { kind: 'savings'; messageId: string; data: ChatSavingsData }
  | { kind: 'update'; messageId: string; payload: UpdatableIntent }
  | { kind: 'delete'; messageId: string; entityType: DeleteEntityTypeValue; data: ChatDeleteData };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const themeColors = useThemeColors();

  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);

  const verifyNetwork = useCallback(async (): Promise<void> => {
    setIsCheckingNetwork(true);
    try {
      const isConnected = await checkNetworkConnection();
      setIsNetworkAvailable(isConnected);
    } catch (error) {
      console.error(CHAT_LOG_STRINGS.networkUnavailable, error);
      setIsNetworkAvailable(false);
    } finally {
      setIsCheckingNetwork(false);
    }
  }, []);

  useEffect(() => {
    verifyNetwork();
  }, [verifyNetwork]);

  // ── Data (each hook called exactly once) ──────────────────────────────────

  const queryClient = useQueryClient();

  const { profile, upsertProfileAsync } = useProfile();

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { createExpenseAsync } = useExpenses();

  const { fixedExpenses, createFixedExpenseAsync, updateFixedExpenseAsync, removeFixedExpenseAsync } =
    useFixedExpenses();

  const { debts, createDebtAsync, updateDebtAsync, removeDebtAsync } = useDebts();

  const { savingsGoals, createSavingsGoalAsync, updateSavingsGoalAsync, removeSavingsGoalAsync } = useSavingsGoals();

  const { income, createIncomeAsync } = useIncome();

  const { messages, isMessagesLoading, sendMessage, sendMessageAsync, updateAction, updateActionAsync, clearHistory } =
    useChat();

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
    sendMessage(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: CHAT_MESSAGE_STRINGS.welcome(profile?.name ?? CHAT_MESSAGE_STRINGS.fallbackProfileName),
      },
      {
        onError: console.error,
      }
    );
  }, [isMessagesLoading, messages.length, profile?.name, sendMessage]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const runMutation = async <T,>(operation: Promise<T>): Promise<T | null> => {
    const [result] = await Promise.allSettled([operation]);
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return null;
  };

  // ── Send handler ──────────────────────────────────────────────────────────

  const handleSend = async (text: string) => {
    if (!profile) return;

    const hasNetwork = await checkNetworkConnection().catch((error) => {
      console.error(CHAT_LOG_STRINGS.networkUnavailable, error);
      return false;
    });

    if (!hasNetwork) {
      setIsNetworkAvailable(false);
      return;
    }

    setIsSending(true);
    setQuotedMessage(null);

    const userMessage = await runMutation(
      sendMessageAsync(
        {
          role: ChatRoleEnum.USER,
          content: text,
          quotedMessageId: quotedMessage?.id ?? null,
        },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.saveUserMessageError, error),
        }
      )
    );

    if (!userMessage) {
      setIsSending(false);
      return;
    }

    const context = {
      profile: {
        name: profile.name,
        salary: profile.salary,
        monthlySavingsTarget: profile.monthlySavingsTarget,
        frivolousBudget: profile.frivolousBudget,
        debtPayoffPreference: profile.debtPayoffPreference ?? DebtPayoffPreferenceEnum.AVALANCHE,
      },
      fixedExpenses,
      debts,
      savingsGoals,
      categoryNames: allCategories.map((c) => c.name),
      creditCards: creditCards.map((c) => ({
        nickname: c.nickname,
        bank: c.bank,
        provider: c.provider,
        last4: c.last4,
      })),
      incomeEntries: income,
    };

    let response: Awaited<ReturnType<typeof sendChatMessage>> | null = null;
    try {
      response = await sendChatMessage(text, context);
    } catch (err) {
      console.error(CHAT_LOG_STRINGS.chatServiceError, err);

      if (err instanceof NetworkError) {
        setIsNetworkAvailable(false);
        setIsSending(false);
        return;
      }

      const reply = CHAT_MESSAGE_STRINGS.serviceErrorReply;
      sendMessage(
        {
          role: ChatRoleEnum.ASSISTANT,
          content: reply,
        },
        {
          onError: console.error,
        }
      );
      setIsSending(false);
      return;
    }

    const actionType = response.intent === ChatIntentEnum.GENERAL ? undefined : response.intent;
    const requiresAction = Boolean(actionType);
    const actionStatus = requiresAction ? ChatActionStatusEnum.PENDING : undefined;

    const assistantMsg = await runMutation(
      sendMessageAsync(
        {
          role: ChatRoleEnum.ASSISTANT,
          content: response.message,
          actionType,
          actionData: response.data ? (response.data as Record<string, unknown>) : undefined,
          actionStatus,
        },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.saveAssistantMessageError, error),
        }
      )
    );

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
        case ChatIntentEnum.ADD_INCOME:
          setPendingAction({ kind: 'income', messageId: assistantMsg.id, data: response.data });
          break;
        case ChatIntentEnum.LOG_SAVINGS:
          setPendingAction({ kind: 'savings', messageId: assistantMsg.id, data: response.data });
          break;
      }
    }

    setIsSending(false);
  };

  // ── Action confirmation handlers ──────────────────────────────────────────

  const handleExpenseConfirm = async (data: ChatExpenseData & { categoryId?: string; creditCardId?: string }) => {
    if (!pendingAction) return;
    const createdExpense = await runMutation(
      createExpenseAsync(
        {
          amount: data.amount,
          categoryId: data.categoryId,
          description: data.description,
          wasImpulse: 0,
          ...(data.creditCardId
            ? { creditCardId: data.creditCardId, creditCardTxnType: CreditCardTxnTypeEnum.PURCHASE }
            : {}),
        },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.saveExpenseError, error),
        }
      )
    );

    if (!createdExpense) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.expenseSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    const completedAction = await runMutation(
      updateActionAsync(
        { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.completeActionError, error),
        }
      )
    );

    if (!completedAction) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.expenseSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    sendMessage(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: CHAT_MESSAGE_STRINGS.expenseAddedReply(data.amount),
      },
      { onError: console.error }
    );
    setPendingAction(null);
  };

  const handleIncomeConfirm = async (data: ChatIncomeData) => {
    if (!pendingAction) return;
    const createdIncome = await runMutation(
      createIncomeAsync(
        {
          amount: data.amount,
          type: data.type,
          customType: data.customType ?? null,
          description: data.description,
          date: data.date,
        },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.addIncomeError, error),
        }
      )
    );

    if (!createdIncome) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.incomeSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    const completedAction = await runMutation(
      updateActionAsync(
        { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.completeActionError, error),
        }
      )
    );

    if (!completedAction) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.incomeSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    sendMessage(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: CHAT_MESSAGE_STRINGS.incomeAddedReply(data.amount),
      },
      { onError: console.error }
    );
    setPendingAction(null);
  };

  const handleSavingsConfirm = async (data: ChatSavingsData) => {
    if (!pendingAction) return;
    const createdDeposit = await runMutation(
      createExpenseAsync(
        {
          amount: data.amount,
          isSaving: 1,
          isWithdrawal: 0,
          savingsType: data.savingsType,
          savingsGoalId: data.savingsGoalId ?? undefined,
          description: data.description,
          excludeFromSpending: 1,
        },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.addSavingsDepositError, error),
        }
      )
    );

    if (!createdDeposit) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.savingsSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ADHOC_SAVINGS_BALANCES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY });

    const completedAction = await runMutation(
      updateActionAsync(
        { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.completeActionError, error),
        }
      )
    );

    if (!completedAction) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.savingsSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    sendMessage(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: CHAT_MESSAGE_STRINGS.savingsAddedReply(data.amount),
      },
      { onError: console.error }
    );
    setPendingAction(null);
  };

  const handleUpdateConfirm = async (values: Record<string, string>) => {
    if (!pendingAction || pendingAction.kind !== 'update') return;
    const { payload, messageId } = pendingAction;

    let updateResult: unknown = null;
    let operationAttempted = false;
    switch (payload.intent) {
      case ChatIntentEnum.UPDATE_PROFILE:
        operationAttempted = true;
        updateResult = await runMutation(
          upsertProfileAsync(
            {
              name: profile!.name,
              salary: profile!.salary,
              monthlySavingsTarget: profile!.monthlySavingsTarget,
              frivolousBudget: profile!.frivolousBudget,
              debtPayoffPreference: profile!.debtPayoffPreference ?? DebtPayoffPreferenceEnum.AVALANCHE,
              [payload.data.field]: parseFloat(values[ProfileUpdateFieldKey.VALUE] ?? '0'),
            },
            {
              onError: (error) => console.error(CHAT_LOG_STRINGS.updateProfileError, error),
            }
          )
        );
        break;
      case ChatIntentEnum.ADD_FIXED_EXPENSE:
        operationAttempted = true;
        updateResult = await runMutation(
          createFixedExpenseAsync(
            {
              name: values[FixedExpenseFieldKey.NAME]!,
              type: payload.data.type!,
              amount: parseFloat(values[FixedExpenseFieldKey.AMOUNT] ?? '0'),
            },
            {
              onError: (error) => console.error(CHAT_LOG_STRINGS.addFixedExpenseError, error),
            }
          )
        );
        break;
      case ChatIntentEnum.UPDATE_FIXED_EXPENSE: {
        const match = fixedExpenses.find((fe) => fe.name === payload.data.existingName);
        if (match) {
          operationAttempted = true;
          updateResult = await runMutation(
            updateFixedExpenseAsync(
              {
                id: match.id,
                data: {
                  ...(values[FixedExpenseFieldKey.NAME] && { name: values[FixedExpenseFieldKey.NAME] }),
                  amount: parseFloat(values[FixedExpenseFieldKey.AMOUNT] ?? '0'),
                },
              },
              {
                onError: (error) => console.error(CHAT_LOG_STRINGS.updateFixedExpenseError, error),
              }
            )
          );
        }
        break;
      }
      case ChatIntentEnum.ADD_DEBT:
        operationAttempted = true;
        updateResult = await runMutation(
          createDebtAsync(
            {
              name: values[DebtFieldKey.NAME]!,
              type: payload.data.type!,
              principal: parseFloat(values[DebtFieldKey.PRINCIPAL] ?? '0'),
              interestRate: parseFloat(values[DebtFieldKey.INTEREST_RATE] ?? '0'),
              emiAmount: parseFloat(values[DebtFieldKey.EMI_AMOUNT] ?? '0'),
              tenureMonths: parseInt(values[DebtFieldKey.TENURE_MONTHS] ?? '0', 10),
              remaining: parseFloat(values[DebtFieldKey.PRINCIPAL] ?? '0'),
              remainingMonths: parseInt(values[DebtFieldKey.TENURE_MONTHS] ?? '0', 10),
              customType: null,
              startDate: null,
            },
            {
              onError: (error) => console.error(CHAT_LOG_STRINGS.addDebtError, error),
            }
          )
        );
        break;
      case ChatIntentEnum.UPDATE_DEBT: {
        const match = debts.find((d) => d.name === payload.data.existingName);
        if (match) {
          operationAttempted = true;
          updateResult = await runMutation(
            updateDebtAsync(
              {
                id: match.id,
                data: {
                  ...(values[DebtFieldKey.NAME] && { name: values[DebtFieldKey.NAME] }),
                  ...(values[DebtFieldKey.PRINCIPAL] && { principal: parseFloat(values[DebtFieldKey.PRINCIPAL]) }),
                  ...(values[DebtFieldKey.INTEREST_RATE] && {
                    interestRate: parseFloat(values[DebtFieldKey.INTEREST_RATE]),
                  }),
                  ...(values[DebtFieldKey.EMI_AMOUNT] && { emiAmount: parseFloat(values[DebtFieldKey.EMI_AMOUNT]) }),
                  ...(values[DebtFieldKey.TENURE_MONTHS] && {
                    tenureMonths: parseInt(values[DebtFieldKey.TENURE_MONTHS], 10),
                  }),
                },
              },
              {
                onError: (error) => console.error(CHAT_LOG_STRINGS.updateDebtError, error),
              }
            )
          );
        }
        break;
      }
      case ChatIntentEnum.ADD_SAVINGS_GOAL:
        operationAttempted = true;
        updateResult = await runMutation(
          createSavingsGoalAsync(
            {
              name: values[SavingsGoalFieldKey.NAME]!,
              type: payload.data.type!,
              targetAmount: parseFloat(values[SavingsGoalFieldKey.TARGET_AMOUNT] ?? '0'),
            },
            {
              onError: (error) => console.error(CHAT_LOG_STRINGS.addSavingsGoalError, error),
            }
          )
        );
        break;
      case ChatIntentEnum.UPDATE_SAVINGS_GOAL: {
        const match = savingsGoals.find((g) => g.name === payload.data.existingName);
        if (match) {
          operationAttempted = true;
          updateResult = await runMutation(
            updateSavingsGoalAsync(
              {
                id: match.id,
                data: {
                  ...(values[SavingsGoalFieldKey.NAME] && { name: values[SavingsGoalFieldKey.NAME] }),
                  targetAmount: parseFloat(values[SavingsGoalFieldKey.TARGET_AMOUNT] ?? '0'),
                },
              },
              {
                onError: (error) => console.error(CHAT_LOG_STRINGS.updateSavingsGoalError, error),
              }
            )
          );
        }
        break;
      }
    }

    if (operationAttempted && updateResult === null) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.updateSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    const completedAction = await runMutation(
      updateActionAsync(
        { id: messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.completeActionError, error),
        }
      )
    );

    if (!completedAction) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.updateSaveFailedReply },
        { onError: console.error }
      );
      setPendingAction(null);
      return;
    }

    sendMessage(
      { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.updateSuccessReply },
      { onError: console.error }
    );
    setPendingAction(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingAction || pendingAction.kind !== 'delete') return;
    const { data, entityType, messageId } = pendingAction;

    setIsDeleting(true);
    let deleteResult: unknown = {};
    switch (entityType) {
      case DeleteEntityType.FIXED_EXPENSE: {
        const match = fixedExpenses.find((fe) => fe.name === data.existingName);
        if (match) {
          deleteResult = await runMutation(
            removeFixedExpenseAsync(match.id, {
              onError: (error) => console.error(CHAT_LOG_STRINGS.deleteFixedExpenseError, error),
            })
          );
        }
        break;
      }
      case DeleteEntityType.DEBT: {
        const match = debts.find((d) => d.name === data.existingName);
        if (match) {
          deleteResult = await runMutation(
            removeDebtAsync(match.id, {
              onError: (error) => console.error(CHAT_LOG_STRINGS.deleteDebtError, error),
            })
          );
        }
        break;
      }
      case DeleteEntityType.SAVINGS_GOAL: {
        const match = savingsGoals.find((g) => g.name === data.existingName);
        if (match) {
          deleteResult = await runMutation(
            removeSavingsGoalAsync(match.id, {
              onError: (error) => console.error(CHAT_LOG_STRINGS.deleteSavingsGoalError, error),
            })
          );
        }
        break;
      }
    }

    if (deleteResult === null) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.deleteFailedReply },
        { onError: console.error }
      );
      setIsDeleting(false);
      setPendingAction(null);
      return;
    }

    const completedAction = await runMutation(
      updateActionAsync(
        { id: messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        {
          onError: (error) => console.error(CHAT_LOG_STRINGS.completeActionError, error),
        }
      )
    );

    if (!completedAction) {
      sendMessage(
        { role: ChatRoleEnum.ASSISTANT, content: CHAT_MESSAGE_STRINGS.deleteFailedReply },
        { onError: console.error }
      );
      setIsDeleting(false);
      setPendingAction(null);
      return;
    }

    sendMessage(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: CHAT_MESSAGE_STRINGS.deleteSuccessReply(data.existingName),
      },
      { onError: console.error }
    );
    setIsDeleting(false);
    setPendingAction(null);
  };

  const handleActionCancel = () => {
    if (!pendingAction) return;
    updateAction(
      { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.CANCELLED },
      {
        onError: console.error,
        onSuccess: () => setPendingAction(null),
      }
    );
  };

  // ── Clear history ──────────────────────────────────────────────────────────

  const handleClearHistory = () => {
    Alert.alert(CHAT_ALERT_STRINGS.clearHistoryTitle, CHAT_ALERT_STRINGS.clearHistoryBody, [
      { text: CHAT_ALERT_STRINGS.cancelButton, style: 'cancel' },
      {
        text: CHAT_ALERT_STRINGS.clearButton,
        style: 'destructive',
        onPress: () =>
          clearHistory(undefined, {
            onError: console.error,
            onSuccess: () => {
              welcomeSentRef.current = false;
            },
          }),
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const quoted = item.quotedMessageId ? (messages.find((m) => m.id === item.quotedMessageId) ?? null) : null;
    return <ChatBubble message={item} quotedMessage={quoted} onQuote={setQuotedMessage} />;
  };

  if (!isNetworkAvailable) {
    return (
      <BSafeAreaView edges={['top']}>
        <BView flex center gap={SpacingValue.MD} paddingX={SpacingValue.LG}>
          <BIcon name="cloud-offline-outline" size="lg" color={themeColors.error} />
          <BText variant={TextVariant.SUBHEADING} style={{ textAlign: 'center' }}>
            {CHAT_STRINGS.NETWORK_ERROR_TITLE}
          </BText>
          <BText variant={TextVariant.BODY} muted style={{ textAlign: 'center' }}>
            {CHAT_STRINGS.NETWORK_ERROR_BODY}
          </BText>
          <BButton
            variant={ButtonVariant.PRIMARY}
            onPress={verifyNetwork}
            loading={isCheckingNetwork}
            paddingX={SpacingValue.XL}
            paddingY={SpacingValue.SM}
            gap={SpacingValue.SM}
          >
            <BIcon name="refresh-outline" size="sm" color={themeColors.white} />
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {CHAT_STRINGS.NETWORK_ERROR_RETRY}
            </BText>
          </BButton>
        </BView>
      </BSafeAreaView>
    );
  }

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
        {pendingAction?.kind === 'income' && (
          <InlineIncomeForm
            initialData={pendingAction.data}
            onSubmit={handleIncomeConfirm}
            onCancel={handleActionCancel}
            isSubmitting={isSending}
          />
        )}
        {pendingAction?.kind === 'savings' && (
          <InlineSavingsForm
            initialData={pendingAction.data}
            onSubmit={handleSavingsConfirm}
            onCancel={handleActionCancel}
            isSubmitting={isSending}
            savingsGoals={savingsGoals}
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
