/**
 * useMutationMap
 *
 * Calls all domain mutation hooks unconditionally and exposes the async
 * variants in a string-keyed map. Registry mutation steps reference these
 * keys at runtime, so adding a new key here makes it available to any
 * future registry entry without touching the generic handler.
 */
import {
  useExpenses,
  useFixedExpenses,
  useIncome,
  useDebts,
  useSavingsGoals,
  useProfile,
  useCreditCards,
  useDeleteSplitwiseExpense,
  useSplitwise,
  useSplitwiseBalances,
  useSplitwiseSettlement,
  useSplitwiseSync,
  useSplitExpense,
} from '@/src/hooks';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { getMostRecentSplitwiseLinkedExpense } from '@/db';
import { formatCurrency } from '@/src/utils/format';
import type { MutationMap } from '@/src/types';

export const useMutationMap = (): MutationMap => {
  const { createExpenseAsync, updateExpenseAsync, removeExpenseAsync } = useExpenses();
  const { createFixedExpenseAsync, updateFixedExpenseAsync, removeFixedExpenseAsync } = useFixedExpenses();
  const { createIncomeAsync, updateIncomeAsync, removeIncomeAsync } = useIncome();
  const { createDebtAsync, updateDebtAsync, removeDebtAsync } = useDebts();
  const { createSavingsGoalAsync, updateSavingsGoalAsync, removeSavingsGoalAsync } = useSavingsGoals();
  const { upsertProfileAsync } = useProfile();
  const { createCreditCardAsync, updateCreditCardAsync, removeCreditCardAsync } = useCreditCards();
  const { connectAsync, disconnectAsync } = useSplitwise();
  const { syncSplitwiseAsync } = useSplitwiseSync();
  const { splitExpenseAsync } = useSplitExpense();
  const { settleSplitwiseAsync } = useSplitwiseSettlement();
  const { totalOwedToYou, totalYouOwe, friendBalances } = useSplitwiseBalances();
  const { canDeleteSplitwiseExpense, deleteExpenseWithSplitwiseAsync } = useDeleteSplitwiseExpense();

  /**
   * Chat-friendly settlement mutation. Resolves a friend by displayName, then
   * delegates to useSplitwiseSettlement. The mode is inferred from the friend's
   * net balance: negative balance (you owe them) → settle-up; positive → mark-received.
   */
  const settleSplitwiseChatAsync = async (args: { friendName: string; amount?: number }): Promise<unknown> => {
    const trimmed = args.friendName.trim().toLowerCase();
    const friend = friendBalances.find((fb) => fb.displayName.toLowerCase().includes(trimmed));
    if (!friend) {
      throw new Error(SPLITWISE_BALANCES_STRINGS.chatSettleFriendNotFound(args.friendName));
    }
    const friendUserId = parseInt(friend.paidByUserId, 10);
    if (Number.isNaN(friendUserId)) {
      throw new Error(SPLITWISE_BALANCES_STRINGS.chatSettleFriendNotFound(args.friendName));
    }
    const mode = friend.netAmount >= 0 ? 'mark-received' : 'settle-up';
    const defaultAmount = friend.netAmount >= 0 ? friend.owedToYou : friend.youOwe;
    const amount = args.amount && args.amount > 0 ? args.amount : defaultAmount;
    if (amount <= 0) {
      throw new Error(SPLITWISE_BALANCES_STRINGS.chatSettleFailure);
    }
    return settleSplitwiseAsync({
      mode,
      friendUserId,
      friendName: friend.displayName,
      amount,
    });
  };

  const checkBalancesAsync = async (_args: unknown): Promise<string> => {
    if (totalOwedToYou === 0 && totalYouOwe === 0) {
      return SPLITWISE_BALANCES_STRINGS.checkBalancesEmpty;
    }
    const lines: string[] = [];
    if (totalOwedToYou > 0) {
      lines.push(SPLITWISE_BALANCES_STRINGS.checkBalancesOwed(formatCurrency(totalOwedToYou)));
    }
    if (totalYouOwe > 0) {
      lines.push(SPLITWISE_BALANCES_STRINGS.checkBalancesOwe(formatCurrency(totalYouOwe)));
    }
    for (const fb of friendBalances) {
      if (fb.owedToYou > 0) {
        lines.push(
          SPLITWISE_BALANCES_STRINGS.checkBalancesPerFriend(fb.displayName, formatCurrency(fb.owedToYou), 'owed')
        );
      } else if (fb.youOwe > 0) {
        lines.push(SPLITWISE_BALANCES_STRINGS.checkBalancesPerFriend(fb.displayName, formatCurrency(fb.youOwe), 'owe'));
      }
    }
    return lines.join('\n');
  };

  /**
   * Chat-friendly delete of a Splitwise-synced expense. Finds the most recent
   * expense whose description contains the given fragment AND has a linked
   * splitwise_expenses row, via the shared delete-with-Splitwise flow (same
   * payer check and enqueue-only remote delete as the transaction detail screen).
   */
  const deleteSplitwiseExpenseAsync = async (args: { descriptionFragment: string }): Promise<string> => {
    const fragment = args.descriptionFragment?.trim();
    if (!fragment) {
      throw new Error(SPLITWISE_OUTBOUND_STRINGS.chatDeleteFailure);
    }

    const match = await getMostRecentSplitwiseLinkedExpense(fragment);
    if (!match) {
      throw new Error(SPLITWISE_OUTBOUND_STRINGS.chatDeleteNotFound(fragment));
    }

    if (!canDeleteSplitwiseExpense(match.paidByUserId)) {
      return SPLITWISE_OUTBOUND_STRINGS.chatDeleteNonPayer;
    }

    await deleteExpenseWithSplitwiseAsync({ expenseId: match.expenseId, splitwiseId: match.splitwiseId });

    return SPLITWISE_OUTBOUND_STRINGS.chatDeleteSuccess;
  };

  return {
    createExpense: createExpenseAsync,
    updateExpense: updateExpenseAsync,
    removeExpense: removeExpenseAsync,
    createFixedExpense: createFixedExpenseAsync,
    updateFixedExpense: updateFixedExpenseAsync,
    removeFixedExpense: removeFixedExpenseAsync,
    createIncome: createIncomeAsync,
    updateIncome: updateIncomeAsync,
    removeIncome: removeIncomeAsync,
    createDebt: createDebtAsync,
    updateDebt: updateDebtAsync,
    removeDebt: removeDebtAsync,
    createSavingsGoal: createSavingsGoalAsync,
    updateSavingsGoal: updateSavingsGoalAsync,
    removeSavingsGoal: removeSavingsGoalAsync,
    upsertProfile: upsertProfileAsync,
    createCreditCard: createCreditCardAsync,
    updateCreditCard: updateCreditCardAsync,
    removeCreditCard: removeCreditCardAsync,
    connectSplitwise: connectAsync,
    disconnectSplitwise: disconnectAsync,
    syncSplitwise: syncSplitwiseAsync,
    checkBalances: checkBalancesAsync,
    splitExpense: splitExpenseAsync,
    settleSplitwise: settleSplitwiseChatAsync,
    deleteSplitwiseExpense: deleteSplitwiseExpenseAsync,
  };
};
