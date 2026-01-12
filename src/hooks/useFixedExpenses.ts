import {
  createFixedExpense,
  deleteFixedExpense,
  getFixedExpenses,
  getTotalFixedExpenses,
  updateFixedExpense,
} from '@/db';
import type { UpdateFixedExpenseInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const FIXED_EXPENSES_QUERY_KEY = ['fixedExpenses'] as const;
export const TOTAL_FIXED_EXPENSES_QUERY_KEY = ['fixedExpenses', 'total'] as const;

/**
 * Hook for fixed expenses queries and mutations
 */
export const useFixedExpenses = (activeOnly = true) => {
  const queryClient = useQueryClient();

  const fixedExpensesQuery = useQuery({
    queryKey: [...FIXED_EXPENSES_QUERY_KEY, { activeOnly }],
    queryFn: () => getFixedExpenses(activeOnly),
  });

  const totalQuery = useQuery({
    queryKey: TOTAL_FIXED_EXPENSES_QUERY_KEY,
    queryFn: getTotalFixedExpenses,
  });

  const createMutation = useMutation({
    mutationFn: createFixedExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFixedExpenseInput }) => updateFixedExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_EXPENSES_QUERY_KEY });
    },
  });

  return {
    // Query state
    fixedExpenses: fixedExpensesQuery.data ?? [],
    totalFixedExpenses: totalQuery.data ?? 0,
    isFixedExpensesLoading: fixedExpensesQuery.isLoading,
    isFixedExpensesError: fixedExpensesQuery.isError,
    fixedExpensesError: fixedExpensesQuery.error,
    refetchFixedExpenses: fixedExpensesQuery.refetch,

    // Mutations
    createFixedExpense: createMutation.mutate,
    createFixedExpenseAsync: createMutation.mutateAsync,
    isCreatingFixedExpense: createMutation.isPending,

    updateFixedExpense: updateMutation.mutate,
    updateFixedExpenseAsync: updateMutation.mutateAsync,
    isUpdatingFixedExpense: updateMutation.isPending,

    removeFixedExpense: deleteMutation.mutate,
    removeFixedExpenseAsync: deleteMutation.mutateAsync,
    isRemovingFixedExpense: deleteMutation.isPending,
  };
};
