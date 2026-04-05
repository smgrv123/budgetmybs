import {
  createExpense,
  createOneOffSaving,
  deleteExpense,
  getExpenseById,
  getExpensesWithCategory,
  getImpulsePurchaseStats,
  getOneOffSavings,
  getSpendingByCategory,
  getTotalSavedByMonth,
  getTotalSpentByMonth,
  updateExpense,
} from '@/db';
import type { UpdateExpenseInput } from '@/db/schema-types';
import { getCurrentMonth } from '@/db/utils';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  CREDIT_CARDS_QUERY_KEY,
  CREDIT_CARD_SUMMARIES_QUERY_KEY,
  EXPENSES_QUERY_KEY,
  EXPENSE_BY_ID_QUERY_KEY,
  ONE_OFF_SAVINGS_QUERY_KEY,
  TOTAL_SPENT_QUERY_KEY,
  TOTAL_SAVED_QUERY_KEY,
} from './queryKeys';

/**
 * Fetches a single expense by ID with its category join.
 */
export const useExpenseById = (id: string | undefined) => {
  const query = useQuery({
    queryKey: [...EXPENSE_BY_ID_QUERY_KEY, id],
    queryFn: () => getExpenseById(id!),
    enabled: Boolean(id),
  });

  return {
    expense: query.data ?? null,
    isExpenseLoading: query.isLoading,
    isExpenseError: query.isError,
    refetchExpense: query.refetch,
  };
};

/**
 * Hook for expenses and one-off savings queries and mutations
 */
export const useExpenses = (month: string = getCurrentMonth()) => {
  const queryClient = useQueryClient();

  // Expenses queries
  const expensesQuery = useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, { month }],
    queryFn: () => getExpensesWithCategory(month),
  });

  const expensesWithCategoryQuery = useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, 'withCategory', { month }],
    queryFn: () => getExpensesWithCategory(month),
  });

  const spendingByCategoryQuery = useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, 'byCategory', { month }],
    queryFn: () => getSpendingByCategory(month),
  });

  const impulsePurchaseStatsQuery = useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, 'impulseStats', { month }],
    queryFn: () => getImpulsePurchaseStats(month),
  });

  const totalSpentQuery = useQuery({
    queryKey: [...TOTAL_SPENT_QUERY_KEY, { month }],
    queryFn: () => getTotalSpentByMonth(month),
  });

  // One-off savings queries
  const oneOffSavingsQuery = useQuery({
    queryKey: [...ONE_OFF_SAVINGS_QUERY_KEY, { month }],
    queryFn: () => getOneOffSavings(month),
  });

  const totalSavedQuery = useQuery({
    queryKey: [...TOTAL_SAVED_QUERY_KEY, { month }],
    queryFn: () => getTotalSavedByMonth(month),
  });

  // Expense mutations
  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id: expenseId, data }: { id: string; data: UpdateExpenseInput }) => updateExpense(expenseId, data),
    onSuccess: ({ newUsedAmount }) => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSE_BY_ID_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
      if (newUsedAmount !== null && newUsedAmount < 0) {
        Alert.alert(
          CREDIT_CARDS_SETTINGS_STRINGS.alerts.negativeBalanceTitle,
          CREDIT_CARDS_SETTINGS_STRINGS.alerts.negativeBalanceBody
        );
      }
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: ({ newUsedAmount }) => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSE_BY_ID_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
      if (newUsedAmount !== null && newUsedAmount < 0) {
        Alert.alert(
          CREDIT_CARDS_SETTINGS_STRINGS.alerts.negativeBalanceTitle,
          CREDIT_CARDS_SETTINGS_STRINGS.alerts.negativeBalanceBody
        );
      }
    },
  });

  // One-off saving mutations
  const createOneOffSavingMutation = useMutation({
    mutationFn: createOneOffSaving,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONE_OFF_SAVINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SAVED_QUERY_KEY });
    },
  });

  return {
    // Expense query state
    expenses: expensesQuery.data ?? [],
    expensesWithCategory: expensesWithCategoryQuery.data ?? [],
    spendingByCategory: spendingByCategoryQuery.data ?? [],
    impulsePurchaseStats: impulsePurchaseStatsQuery.data ?? { total: 0, count: 0 },
    totalSpent: totalSpentQuery.data ?? 0,
    isExpensesLoading: expensesQuery.isLoading,
    isExpensesError: expensesQuery.isError,
    expensesError: expensesQuery.error,
    refetchExpenses: expensesQuery.refetch,

    isExpensesWithCategoryLoading: expensesWithCategoryQuery.isLoading,
    isSpendingByCategoryLoading: spendingByCategoryQuery.isLoading,
    isImpulseStatsLoading: impulsePurchaseStatsQuery.isLoading,
    isTotalSpentLoading: totalSpentQuery.isLoading,

    // One-off savings query state
    oneOffSavings: oneOffSavingsQuery.data ?? [],
    totalSaved: totalSavedQuery.data ?? 0,
    isOneOffSavingsLoading: oneOffSavingsQuery.isLoading,
    isOneOffSavingsError: oneOffSavingsQuery.isError,
    oneOffSavingsError: oneOffSavingsQuery.error,
    refetchOneOffSavings: oneOffSavingsQuery.refetch,

    isTotalSavedLoading: totalSavedQuery.isLoading,

    // Expense mutations
    createExpense: createExpenseMutation.mutate,
    createExpenseAsync: createExpenseMutation.mutateAsync,
    isCreatingExpense: createExpenseMutation.isPending,
    createExpenseError: createExpenseMutation.error,

    updateExpense: updateExpenseMutation.mutate,
    updateExpenseAsync: updateExpenseMutation.mutateAsync,
    isUpdatingExpense: updateExpenseMutation.isPending,
    updateExpenseError: updateExpenseMutation.error,

    removeExpense: deleteExpenseMutation.mutate,
    removeExpenseAsync: deleteExpenseMutation.mutateAsync,
    isRemovingExpense: deleteExpenseMutation.isPending,
    removeExpenseError: deleteExpenseMutation.error,

    // One-off saving mutations
    createOneOffSaving: createOneOffSavingMutation.mutate,
    createOneOffSavingAsync: createOneOffSavingMutation.mutateAsync,
    isCreatingOneOffSaving: createOneOffSavingMutation.isPending,
    createOneOffSavingError: createOneOffSavingMutation.error,
  };
};
