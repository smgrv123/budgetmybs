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
 */
import { INTENT_REGISTRY } from '@/src/constants/chatRegistry.config';
import {
  CHAT_ACTION_MESSAGE_POOLS,
  INTENT_CATEGORY_MAP,
  pickMessage,
} from '@/src/constants/chat.registry.strings';
import { useCategories } from './useCategories';
import { useChat } from './useChat';
import { useCreditCards } from './useCreditCards';
import { useDebts } from './useDebts';
import { useFixedExpenses } from './useFixedExpenses';
import { useProfile } from './useProfile';
import { useSavingsGoals } from './useSavingsGoals';
import { useMutationMap } from './useMutationMap';
import { ChatActionStatusEnum } from '@/db/types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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

  const mutationMap = useMutationMap();

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
    };

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
      await replaceMessageAsync({ id: pendingAction.messageId, content: failureMsg, actionStatus: ChatActionStatusEnum.CANCELLED });
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
      await replaceMessageAsync({ id: pendingAction.messageId, content: successMsg, actionStatus: ChatActionStatusEnum.COMPLETED });
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
      await replaceMessageAsync({ id: pendingAction.messageId, content: cancelMsg, actionStatus: ChatActionStatusEnum.CANCELLED });
    } catch (err) {
      console.error('Failed to replace message on cancel:', err);
    }
  };

  return { handleConfirm, handleCancel, isSubmitting };
};
