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
  useSplitwise,
  useSplitwiseBalances,
  useSplitwiseSync,
  useSplitExpense,
} from '@/src/hooks';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
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
  const { totalOwedToYou, totalYouOwe, friendBalances } = useSplitwiseBalances();

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
  };
};
