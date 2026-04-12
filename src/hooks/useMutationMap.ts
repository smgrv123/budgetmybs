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
  useSplitwiseSync,
} from '@/src/hooks';
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
  };
};
