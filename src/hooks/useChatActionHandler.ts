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
import { useCategories } from './useCategories';
import { useChat } from './useChat';
import { useCreditCards } from './useCreditCards';
import { useDebts } from './useDebts';
import { useFixedExpenses } from './useFixedExpenses';
import { useProfile } from './useProfile';
import { useSavingsGoals } from './useSavingsGoals';
import { useMutationMap } from './useMutationMap';
import { ChatActionStatusEnum, ChatRoleEnum } from '@/db/types';
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

  const { sendMessage, updateActionAsync } = useChat();

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

    if (!allSucceeded) {
      sendMessage({ role: ChatRoleEnum.ASSISTANT, content: entry.messages.failure }, { onError: console.error });
      setIsSubmitting(false);
      return;
    }

    // Invalidate additional query keys
    for (const key of entry.invalidations) {
      queryClient.invalidateQueries({ queryKey: key });
    }

    // Mark action as completed
    try {
      await updateActionAsync(
        { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.COMPLETED },
        { onError: (error) => console.error('Failed to complete action:', error) }
      );
    } catch (err) {
      console.error('Failed to complete action:', err);
      sendMessage({ role: ChatRoleEnum.ASSISTANT, content: entry.messages.failure }, { onError: console.error });
      setIsSubmitting(false);
      return;
    }

    // Send success message
    const successMsg =
      typeof entry.messages.success === 'function'
        ? entry.messages.success(formValues, context)
        : entry.messages.success;

    sendMessage({ role: ChatRoleEnum.ASSISTANT, content: successMsg }, { onError: console.error });

    setIsSubmitting(false);
  };

  const handleCancel = async () => {
    if (!pendingAction) return;

    const entry = INTENT_REGISTRY[pendingAction.intent];

    try {
      await updateActionAsync(
        { id: pendingAction.messageId, actionStatus: ChatActionStatusEnum.CANCELLED },
        { onError: console.error }
      );
    } catch (err) {
      console.error('Failed to cancel action:', err);
    }

    if (entry) {
      sendMessage({ role: ChatRoleEnum.ASSISTANT, content: entry.messages.cancelled }, { onError: console.error });
    }
  };

  return { handleConfirm, handleCancel, isSubmitting };
};
