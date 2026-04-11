/**
 * useChatActionHandler
 *
 * Generic action handler for registry-based chat intents.
 * Given a pending action that maps to a registry entry, it:
 *  1. Reads registry config
 *  2. Transforms form values via context
 *  3. Executes mutations sequentially, bailing on first failure
 *  4. Sends success/failure chat message
 *  5. Marks action completed/cancelled
 *  6. Invalidates the relevant query keys
 *
 * Special case: LOG_IMPULSE_COOLDOWN bypasses the mutations loop and instead:
 *  - Calls useImpulsePermission.onImpulseToggleActivated() to check/request permissions
 *  - If granted: saves to AsyncStorage + schedules a notification
 *  - If denied:  logs directly to DB with wasImpulse: 1
 */
import { ImpulseCooldownFieldKey, INTENT_REGISTRY } from '@/src/constants/chatRegistry.config';
import {
  CHAT_ACTION_MESSAGE_POOLS,
  CHAT_REGISTRY_STRINGS,
  INTENT_CATEGORY_MAP,
  pickMessage,
} from '@/src/constants/chat.registry.strings';
import { SPLITWISE_STRINGS } from '@/src/constants/splitwise.strings';
import { ChatActionStatusEnum, ChatIntentEnum, CreditCardTxnTypeEnum } from '@/db/types';
import { formatDate as formatDbDate } from '@/db/utils';
import { scheduleImpulseNotification } from '@/src/services/notificationService';
import { generateUUID } from '@/src/utils/id';
import { saveImpulsePurchase, updateNotificationId } from '@/src/utils/impulseAsyncStore';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useCategories } from './useCategories';
import { useChat } from './useChat';
import { useCreditCards } from './useCreditCards';
import { useDebts } from './useDebts';
import { useExpenses } from './useExpenses';
import { useFixedExpenses } from './useFixedExpenses';
import { useImpulsePermission } from './useImpulsePermission';
import { useIncome } from './useIncome';
import { useMutationMap } from './useMutationMap';
import { useProfile } from './useProfile';
import { useSavingsGoals } from './useSavingsGoals';

// ── Types ────────────────────────────────────────────────────────────────────

export type RegistryPendingAction = {
  intent: string;
  messageId: string;
  actionData: Record<string, unknown>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useChatActionHandler = (pendingAction: RegistryPendingAction | null) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Data for context — called unconditionally so hooks are stable
  const { profile } = useProfile();
  const { fixedExpenses } = useFixedExpenses();
  const { debts } = useDebts();
  const { savingsGoals } = useSavingsGoals();
  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { expenses } = useExpenses();
  const { income: incomeEntries } = useIncome();

  const mutationMap = useMutationMap();

  // Impulse permission — called unconditionally per hooks rules
  const { onImpulseToggleActivated } = useImpulsePermission();

  const { replaceMessageAsync } = useChat();

  const handleConfirm = async (formValues: Record<string, string>) => {
    if (!pendingAction) return;

    const entry = INTENT_REGISTRY[pendingAction.intent];
    if (!entry) return;

    setIsSubmitting(true);

    const context = {
      profile: profile ?? null,
      fixedExpenses,
      debts,
      savingsGoals,
      categories: allCategories,
      creditCards,
      expenses,
      incomeEntries,
    };

    // ── Special case: LOG_IMPULSE_COOLDOWN ────────────────────────────────────
    // Bypasses the generic mutations loop. Uses useImpulsePermission to gate
    // whether we save to AsyncStorage + schedule a notification, or log to DB directly.
    if (pendingAction.intent === ChatIntentEnum.LOG_IMPULSE_COOLDOWN) {
      const amount = parseFloat(formValues[ImpulseCooldownFieldKey.AMOUNT] ?? '0');
      const categoryId = formValues[ImpulseCooldownFieldKey.CATEGORY_ID] ?? '';
      const description = formValues[ImpulseCooldownFieldKey.DESCRIPTION]?.trim() || undefined;
      const creditCardId = formValues[ImpulseCooldownFieldKey.CREDIT_CARD_ID] || undefined;
      const cooldownMinutes = parseInt(formValues[ImpulseCooldownFieldKey.COOLDOWN_MINUTES] ?? '0', 10);

      let impulseCooldownSucceeded = true;
      let permissionsGranted = false;

      try {
        permissionsGranted = await onImpulseToggleActivated();
      } catch (err) {
        console.error('[useChatActionHandler] Failed to check impulse permissions:', err);
        impulseCooldownSucceeded = false;
      }

      if (impulseCooldownSucceeded) {
        if (permissionsGranted) {
          // Save to AsyncStorage and schedule a notification
          const entryId = generateUUID();
          const now = dayjs();
          const expiresAt = now.add(cooldownMinutes, 'minute').toISOString();
          const date = formatDbDate(now.toDate());

          try {
            await saveImpulsePurchase({
              id: entryId,
              purchaseData: {
                amount,
                categoryId,
                description,
                creditCardId,
                date,
              },
              cooldownMinutes,
              expiresAt,
              notificationId: null,
              createdAt: now.toISOString(),
            });

            const triggerDate = dayjs(expiresAt).toDate();
            const notificationId = await scheduleImpulseNotification({
              entryId,
              description,
              amount,
              triggerDate,
            });

            await updateNotificationId(entryId, notificationId);
          } catch (err) {
            console.error('[useChatActionHandler] Failed to save/schedule impulse cooldown:', err);
            impulseCooldownSucceeded = false;
          }
        } else {
          // Permissions denied — log directly to DB with wasImpulse: 1
          const createExpenseMutation = mutationMap['createExpense'];
          if (!createExpenseMutation) {
            console.error('[useChatActionHandler] createExpense mutation not found in map');
            impulseCooldownSucceeded = false;
          } else {
            try {
              await createExpenseMutation({
                amount,
                categoryId,
                description,
                wasImpulse: 1,
                ...(creditCardId ? { creditCardId, creditCardTxnType: CreditCardTxnTypeEnum.PURCHASE } : {}),
              });
            } catch (err) {
              console.error('[useChatActionHandler] Failed to log impulse purchase directly:', err);
              impulseCooldownSucceeded = false;
            }
          }
        }
      }

      const category = INTENT_CATEGORY_MAP[pendingAction.intent] ?? 'general';

      if (!impulseCooldownSucceeded) {
        const failureMsg = pickMessage(CHAT_ACTION_MESSAGE_POOLS[category].failure);
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: failureMsg,
          actionStatus: ChatActionStatusEnum.CANCELLED,
        });
        setIsSubmitting(false);
        return;
      }

      for (const key of entry.invalidations) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      const successContent = permissionsGranted
        ? CHAT_REGISTRY_STRINGS.LOG_IMPULSE_COOLDOWN_SUCCESS(amount)
        : CHAT_REGISTRY_STRINGS.LOG_IMPULSE_COOLDOWN_SUCCESS_NO_PERMISSION(amount);

      try {
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: successContent,
          actionStatus: ChatActionStatusEnum.COMPLETED,
        });
      } catch (err) {
        console.error('[useChatActionHandler] Failed to replace message with cooldown success:', err);
      }

      setIsSubmitting(false);
      return;
    }

    // ── Special case: CONNECT_SPLITWISE ───────────────────────────────────────
    // Triggers the OAuth browser flow via the mutation map.
    if (pendingAction.intent === ChatIntentEnum.CONNECT_SPLITWISE) {
      const connectFn = mutationMap['connectSplitwise'];
      let connectSucceeded = true;

      if (!connectFn) {
        console.error('[useChatActionHandler] connectSplitwise mutation not found in map');
        connectSucceeded = false;
      } else {
        try {
          await connectFn(undefined);
        } catch (err) {
          console.error('[useChatActionHandler] CONNECT_SPLITWISE failed:', err);
          connectSucceeded = false;
        }
      }

      if (!connectSucceeded) {
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: SPLITWISE_STRINGS.chatConnectFailure,
          actionStatus: ChatActionStatusEnum.CANCELLED,
        });
      } else {
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: SPLITWISE_STRINGS.chatConnectSuccess,
          actionStatus: ChatActionStatusEnum.COMPLETED,
        });
      }

      setIsSubmitting(false);
      return;
    }

    // ── Special case: DISCONNECT_SPLITWISE ────────────────────────────────────
    // Clears stored tokens via the mutation map.
    if (pendingAction.intent === ChatIntentEnum.DISCONNECT_SPLITWISE) {
      const disconnectFn = mutationMap['disconnectSplitwise'];
      let disconnectSucceeded = true;

      if (!disconnectFn) {
        console.error('[useChatActionHandler] disconnectSplitwise mutation not found in map');
        disconnectSucceeded = false;
      } else {
        try {
          await disconnectFn(undefined);
        } catch (err) {
          console.error('[useChatActionHandler] DISCONNECT_SPLITWISE failed:', err);
          disconnectSucceeded = false;
        }
      }

      if (!disconnectSucceeded) {
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: SPLITWISE_STRINGS.chatDisconnectFailure,
          actionStatus: ChatActionStatusEnum.CANCELLED,
        });
      } else {
        await replaceMessageAsync({
          id: pendingAction.messageId,
          content: SPLITWISE_STRINGS.chatDisconnectSuccess,
          actionStatus: ChatActionStatusEnum.COMPLETED,
        });
      }

      setIsSubmitting(false);
      return;
    }

    // Run mutations sequentially; bail on first failure
    let allSucceeded = true;
    for (const step of entry.mutations) {
      const mutationFn = mutationMap[step.key];
      if (!mutationFn) {
        console.error(`[useChatActionHandler] Unknown mutation key: "${step.key}"`);
        allSucceeded = false;
        break;
      }

      const args = step.transformData(formValues, context);

      // For delete intents, skip if we couldn't find the entity (empty string id)
      if (entry.formType === 'deleteConfirm' && (args === '' || args === null || args === undefined)) {
        console.error(step.errorLog, 'Entity not found in context');
        allSucceeded = false;
        break;
      }

      try {
        await mutationFn(args);
      } catch (err) {
        console.error(step.errorLog, err);
        allSucceeded = false;
        break;
      }
    }

    const category = INTENT_CATEGORY_MAP[pendingAction.intent] ?? 'general';

    if (!allSucceeded) {
      const failureMsg = pickMessage(CHAT_ACTION_MESSAGE_POOLS[category].failure);
      await replaceMessageAsync({
        id: pendingAction.messageId,
        content: failureMsg,
        actionStatus: ChatActionStatusEnum.CANCELLED,
      });
      setIsSubmitting(false);
      return;
    }

    // Invalidate additional query keys
    for (const key of entry.invalidations) {
      queryClient.invalidateQueries({ queryKey: key });
    }

    // Replace original message with success text — single message per action
    const successMsg = pickMessage(CHAT_ACTION_MESSAGE_POOLS[category].success);
    try {
      await replaceMessageAsync({
        id: pendingAction.messageId,
        content: successMsg,
        actionStatus: ChatActionStatusEnum.COMPLETED,
      });
    } catch (err) {
      console.error('Failed to replace message with success:', err);
    }

    setIsSubmitting(false);
  };

  const handleCancel = async () => {
    if (!pendingAction) return;

    const category = INTENT_CATEGORY_MAP[pendingAction.intent] ?? 'general';
    const cancelMsg = pickMessage(CHAT_ACTION_MESSAGE_POOLS[category].cancel);

    try {
      await replaceMessageAsync({
        id: pendingAction.messageId,
        content: cancelMsg,
        actionStatus: ChatActionStatusEnum.CANCELLED,
      });
    } catch (err) {
      console.error('Failed to replace message on cancel:', err);
    }
  };

  return { handleConfirm, handleCancel, isSubmitting };
};
