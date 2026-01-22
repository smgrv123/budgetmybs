import {
  createExpense,
  createOneOffSaving,
  deleteExpense,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const EXPENSES_QUERY_KEY = ['expenses'] as const;
export const ONE_OFF_SAVINGS_QUERY_KEY = ['oneOffSavings'] as const;
export const TOTAL_SPENT_QUERY_KEY = ['expenses', 'totalSpent'] as const;
export const TOTAL_SAVED_QUERY_KEY = ['savings', 'totalSaved'] as const;

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
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
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
