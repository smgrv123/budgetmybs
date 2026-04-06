import type { ChatMessage } from '@/db/schema-types';
import { ChatIntentEnum, ChatRoleEnum, DebtPayoffPreferenceEnum, SavingsLabels } from '@/db/types';
import { ChatBubble, ChatHeader, ChatInput, GenericInlineForm } from '@/src/components/chat';
import { BButton, BIcon, BSafeAreaView, BText, BView } from '@/src/components/ui';
import {
  CHAT_ALERT_STRINGS,
  CHAT_LOG_STRINGS,
  CHAT_MESSAGE_STRINGS,
  CHAT_STRINGS,
} from '@/src/constants/chat';
import { INTENT_REGISTRY } from '@/src/constants/chatRegistry.config';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  useCategories,
  useChatActionHandler,
  useChat,
  useCreditCards,
  useDebts,
  useFixedExpenses,
  useProfile,
  useSavingsGoals,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { sendChatMessage } from '@/src/services/chatService';
import { checkNetworkConnection, NetworkError } from '@/src/utils/network';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingAction = {
  kind: 'registry';
  intent: string;
  messageId: string;
  actionData: Record<string, unknown>;
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const themeColors = useThemeColors();

  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);

  const verifyNetwork = async (): Promise<void> => {
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
  };

  useEffect(() => {
    verifyNetwork();
  }, [verifyNetwork]);

  // ── Data (each hook called exactly once) ──────────────────────────────────

  const { profile } = useProfile();

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();

  const { fixedExpenses } = useFixedExpenses();

  const { debts } = useDebts();

  const {
    savingsGoals,
    savingsBalancesAllGoals,
    adHocSavingsBalances,
  } = useSavingsGoals();

  const { messages, isMessagesLoading, sendMessage, sendMessageAsync, clearHistory } = useChat();

  // ── Local state ───────────────────────────────────────────────────────────

  const [isSending, setIsSending] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // ── Registry-based action handler ─────────────────────────────────────────

  const {
    handleConfirm: handleRegistryConfirm,
    handleCancel: handleRegistryCancel,
    isSubmitting: isRegistrySubmitting,
  } = useChatActionHandler(pendingAction);

  const onRegistryCancel = async () => {
    await handleRegistryCancel();
    setPendingAction(null);
  };

  const onRegistryConfirm = async (formValues: Record<string, string>) => {
    await handleRegistryConfirm(formValues);
    setPendingAction(null);
  };

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

    const userMessage = await sendMessageAsync(
      {
        role: ChatRoleEnum.USER,
        content: text,
        quotedMessageId: quotedMessage?.id ?? null,
      },
      {
        onError: (error) => console.error(CHAT_LOG_STRINGS.saveUserMessageError, error),
      }
    ).catch(() => null);

    if (!userMessage) {
      setIsSending(false);
      return;
    }

    // Build savings sources (goal + ad-hoc) for withdrawal context — only include sources with a positive balance
    const goalSources = savingsBalancesAllGoals
      .filter((b) => b.net > 0)
      .map((b) => ({ id: b.goalId, label: b.goalName, availableBalance: b.net }));

    const adHocSources = adHocSavingsBalances
      .filter((b) => b.net > 0)
      .map((b) => ({
        id: b.savingsType as string,
        label: `${SavingsLabels[b.savingsType as keyof typeof SavingsLabels] ?? b.savingsType} (Ad-hoc)`,
        availableBalance: b.net,
      }));

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
      savingsSources: [...goalSources, ...adHocSources],
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

    const assistantMsg = await sendMessageAsync(
      {
        role: ChatRoleEnum.ASSISTANT,
        content: response.message,
        actionType,
        actionData: response.data ? (response.data as Record<string, unknown>) : undefined,
        actionStatus: requiresAction ? 'pending' : undefined,
      },
      {
        onError: (error) => console.error(CHAT_LOG_STRINGS.saveAssistantMessageError, error),
      }
    ).catch(() => null);

    if (requiresAction && assistantMsg && response.intent !== ChatIntentEnum.GENERAL) {
      setPendingAction({
        kind: 'registry',
        intent: response.intent,
        messageId: assistantMsg.id,
        actionData: (response.data ?? {}) as Record<string, unknown>,
      });
    }

    setIsSending(false);
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

        {pendingAction?.kind === 'registry' &&
          (() => {
            const entry = INTENT_REGISTRY[pendingAction.intent];
            if (!entry) return null;
            const registryContext = {
              profile: profile ?? null,
              fixedExpenses,
              debts,
              savingsGoals,
              categories: allCategories,
              creditCards,
            };
            const initialValues = entry.getInitialValues(pendingAction.actionData, registryContext);
            return (
              <GenericInlineForm
                intent={pendingAction.intent}
                initialValues={initialValues}
                onConfirm={onRegistryConfirm}
                onCancel={onRegistryCancel}
                isSubmitting={isRegistrySubmitting}
              />
            );
          })()}

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
