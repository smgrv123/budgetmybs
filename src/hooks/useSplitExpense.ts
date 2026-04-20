/**
 * useSplitExpense
 *
 * Provides splitExpenseAsync for the mutation map.
 * The chat intent creates the local expense first (via createExpense),
 * then calls splitExpenseAsync to push to Splitwise.
 *
 * Args shape: { expenseId: string; friendId: number; totalAmount: number; description: string; currencyCode?: string }
 */

import { useMutation } from '@tanstack/react-query';

import { enqueueFailedPush, pushExpenseToSplitwise } from '@/src/services/splitwise';
import { SplitType } from '@/src/constants/splitwise-outbound.strings';
import { buildSplitPayload } from '@/src/utils/splitwisePushPayload';
import { useSplitwise } from './useSplitwise';

type SplitExpenseArgs = {
  expenseId: string;
  friendId: number;
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
        friendUserId: args.friendId,
        splitState: {
          splitType: SplitType.EQUAL,
          friendId: String(args.friendId),
          groupId: null,
          yourExactAmount: '',
          friendExactAmount: '',
          yourPercentage: '',
          friendPercentage: '',
          yourShares: '',
          friendShares: '',
        },
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
        friendUserId: variables.friendId,
        splitState: {
          splitType: SplitType.EQUAL,
          friendId: String(variables.friendId),
          groupId: null,
          yourExactAmount: '',
          friendExactAmount: '',
          yourPercentage: '',
          friendPercentage: '',
          yourShares: '',
          friendShares: '',
        },
      });

      if (payload) {
        await enqueueFailedPush(variables.expenseId, payload);
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
