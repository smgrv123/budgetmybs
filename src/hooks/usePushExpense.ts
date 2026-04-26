/**
 * usePushExpense
 *
 * Thin mutation wrapper around pushExpenseToSplitwise.
 * The caller is responsible for building the payload.
 * On error, enqueues the payload for retry.
 *
 * Returns { pushExpenseAsync } for fire-and-forget or awaited push.
 */

import { useMutation } from '@tanstack/react-query';

import { enqueueFailedPush, pushExpenseToSplitwise } from '@/src/services/splitwise';

type PushExpenseArgs = {
  expenseId: string;
  payload: Record<string, unknown>;
};

export const usePushExpense = () => {
  const pushMutation = useMutation({
    mutationFn: ({ payload }: PushExpenseArgs) => pushExpenseToSplitwise(payload),
    onError: async (error, variables) => {
      console.error('[usePushExpense] push failed:', error);
      await enqueueFailedPush(variables.expenseId, 'create', variables.payload);
    },
  });

  return {
    pushExpenseAsync: pushMutation.mutateAsync,
    isPushingExpense: pushMutation.isPending,
    pushExpenseError: pushMutation.error,
  };
};
