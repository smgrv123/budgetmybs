/**
 * useSplitExpense
 *
 * Provides splitExpenseAsync for the mutation map.
 * The chat intent creates the local expense first (via createExpense),
 * then calls splitExpenseAsync to push to Splitwise.
 *
 * Args shape: { expenseId: string; friendUserId: number; payerUserId: number; totalAmount: number; description: string; currencyCode?: string }
 */

import { useMutation } from '@tanstack/react-query';

import { enqueueFailedPush, pushExpenseToSplitwise } from '@/src/services/splitwise';
import { INITIAL_SPLIT_STATE } from '@/src/types/splitwise-outbound';
import { buildSplitPayload } from '@/src/utils/splitwisePushPayload';
import { SplitwisePushAction } from '../constants/splitwise.config';
import { useSplitwise } from './useSplitwise';

type SplitExpenseArgs = {
  expenseId: string;
  friendUserId: number;
  payerUserId: number;
  totalAmount: number;
  description: string;
  currencyCode?: string;
};

export const useSplitExpense = () => {
  const { currentUser } = useSplitwise();

  const splitMutation = useMutation({
    mutationFn: async (args: SplitExpenseArgs) => {
      const payload = buildSplitPayload({
        totalAmount: args.totalAmount,
        description: args.description,
        currencyCode: args.currencyCode ?? 'INR',
        payerUserId: args.payerUserId,
        participantUserIds: [args.friendUserId],
        splitState: INITIAL_SPLIT_STATE,
      });

      if (!payload) {
        throw new Error('Failed to build split payload');
      }

      return pushExpenseToSplitwise(payload);
    },
    onError: async (error, variables) => {
      console.error('[useSplitExpense] split failed:', error);

      const payload = buildSplitPayload({
        totalAmount: variables.totalAmount,
        description: variables.description,
        currencyCode: variables.currencyCode ?? 'INR',
        payerUserId: variables.payerUserId,
        participantUserIds: [variables.friendUserId],
        splitState: INITIAL_SPLIT_STATE,
      });

      if (payload) {
        await enqueueFailedPush(variables.expenseId, SplitwisePushAction.CREATE, payload);
      }
    },
  });

  return {
    currentUser,
    splitExpense: splitMutation.mutate,
    splitExpenseAsync: splitMutation.mutateAsync,
    isSplitting: splitMutation.isPending,
    splitError: splitMutation.error,
  };
};
