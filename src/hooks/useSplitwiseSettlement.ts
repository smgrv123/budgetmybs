/**
 * useSplitwiseSettlement
 *
 * TanStack mutation that records a manual Splitwise settlement (Phase 8).
 *
 * Two flow directions are supported via the `mode` arg:
 *   - 'settle-up'      → user pays friend (user is the payer; friend is the recipient)
 *   - 'mark-received'  → friend pays user (friend is the payer; user is the recipient)
 *
 * Steps:
 *   1. Build a `payment: true` payload via buildSettlementPayload.
 *   2. POST to /create_expense (Splitwise records the settlement).
 *   3. Insert a local additional_income row (type: splitwise_settlement) when the
 *      current user is the recipient.
 *   4. If a per-expense settlement was triggered (splitwiseExpenseId provided),
 *      flip receivableSettled = 1 on the linked splitwise_expenses row.
 *   5. Invalidate expenses and Splitwise balance caches.
 *   6. On API failure, enqueue with action: 'create' for later retry via drainPushQueue.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createIncome, updateSplitwiseExpense } from '@/db';
import { IncomeTypeEnum } from '@/db/types';
import { formatDate } from '@/db/utils';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
import { SplitwisePushAction } from '@/src/constants/splitwise.config';
import { enqueueFailedPush, pushSettlementExpense } from '@/src/services/splitwise';
import { buildSettlementPayload } from '@/src/utils/splitwisePushPayload';
import type { SplitwiseUser } from '@/src/types/splitwise';
import { generateUUID } from '@/src/utils/id';
import { EXPENSES_QUERY_KEY, TOTAL_SPENT_QUERY_KEY } from './queryKeys';
import { INCOME_QUERY_KEY, MONTHLY_INCOME_SUM_QUERY_KEY } from './useIncome';
import { SPLITWISE_FRIEND_BALANCES_QUERY_KEY } from './useSplitwiseBalances';
import { useSplitwise } from './useSplitwise';

// ============================================
// TYPES
// ============================================

export type SettlementMode = 'settle-up' | 'mark-received';

export type SettlementArgs = {
  mode: SettlementMode;
  /** Splitwise user ID of the friend involved in the settlement */
  friendUserId: number;
  /** Display name of the friend (used for the local income description) */
  friendName: string;
  /** Settlement amount in INR */
  amount: number;
  /** Optional: local splitwise_expenses row UUID to flip receivableSettled = 1 */
  splitwiseExpenseId?: string;
  /** Optional override for the description; defaults to a localised settlement label */
  description?: string;
  /** Optional currency code; defaults to INR */
  currencyCode?: string;
};

// ============================================
// HOOK
// ============================================

const buildSettlementDescription = (mode: SettlementMode, friendName: string): string =>
  mode === 'settle-up'
    ? `${SPLITWISE_BALANCES_STRINGS.settlementSentIncomePrefix} ${friendName}`
    : // Reuse the inbound prefix for symmetry
      `Splitwise settlement from ${friendName}`;

export const useSplitwiseSettlement = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useSplitwise();

  const settleMutation = useMutation({
    mutationFn: async (args: SettlementArgs): Promise<void> => {
      const localUser: SplitwiseUser | null = currentUser;
      if (!localUser) {
        throw new Error('[useSplitwiseSettlement] No connected Splitwise user');
      }

      const currencyCode = args.currencyCode ?? 'INR';
      const description = args.description ?? buildSettlementDescription(args.mode, args.friendName);

      // Resolve payer / recipient from mode
      const payerUserId = args.mode === 'settle-up' ? localUser.id : args.friendUserId;
      const recipientUserId = args.mode === 'settle-up' ? args.friendUserId : localUser.id;

      try {
        await pushSettlementExpense({
          amount: args.amount,
          description,
          currencyCode,
          payerUserId,
          recipientUserId,
        });
      } catch (apiError) {
        // Queue the create-expense for retry. We use a synthetic local id since
        // settlements may not have a backing local expense row of their own.
        const queuedExpenseId = args.splitwiseExpenseId ?? generateUUID();
        const payload = buildSettlementPayload({
          amount: args.amount,
          description,
          currencyCode,
          payerUserId,
          recipientUserId,
        });
        await enqueueFailedPush(queuedExpenseId, SplitwisePushAction.CREATE, payload);
        throw apiError;
      }

      // Local ledger updates (run after a successful push).
      // Settlement income is created only when the current user actually receives the money.
      if (args.mode === 'mark-received') {
        await createIncome({
          amount: args.amount,
          type: IncomeTypeEnum.SPLITWISE_SETTLEMENT,
          date: formatDate(),
          description,
        });
      }

      // Per-expense settlement: flip the receivable flag on the linked row.
      if (args.splitwiseExpenseId) {
        await updateSplitwiseExpense(args.splitwiseExpenseId, { receivableSettled: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_FRIEND_BALANCES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwiseSettlement] settlement failed:', error);
    },
  });

  return {
    settleSplitwise: settleMutation.mutate,
    settleSplitwiseAsync: settleMutation.mutateAsync,
    isSettling: settleMutation.isPending,
    settleError: settleMutation.error,
  };
};
