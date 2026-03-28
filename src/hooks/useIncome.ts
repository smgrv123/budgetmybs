import { createIncome, deleteIncome, getIncomeByMonth, getMonthlyIncomeSum, updateIncome } from '@/db';
import type { UpdateIncomeInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const INCOME_QUERY_KEY = ['income'] as const;
export const MONTHLY_INCOME_SUM_QUERY_KEY = ['income', 'monthlySum'] as const;

/**
 * Hook for income queries and mutations.
 *
 * @param month - Optional YYYY-MM string. Defaults to current month.
 */
export const useIncome = (month?: string) => {
  const queryClient = useQueryClient();

  const incomeQuery = useQuery({
    queryKey: [...INCOME_QUERY_KEY, { month }],
    queryFn: () => getIncomeByMonth(month),
  });

  const monthlySumQuery = useQuery({
    queryKey: [...MONTHLY_INCOME_SUM_QUERY_KEY, { month }],
    queryFn: () => getMonthlyIncomeSum(month),
  });

  const createMutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to create income entry:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeInput }) => updateIncome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update income entry:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to delete income entry:', error);
    },
  });

  return {
    // Query state
    income: incomeQuery.data ?? [],
    monthlyIncomeSum: monthlySumQuery.data ?? 0,
    isIncomeLoading: incomeQuery.isLoading,
    isIncomeError: incomeQuery.isError,
    incomeError: incomeQuery.error,
    refetchIncome: incomeQuery.refetch,

    // Mutations
    createIncome: createMutation.mutate,
    createIncomeAsync: createMutation.mutateAsync,
    isCreatingIncome: createMutation.isPending,
    createIncomeError: createMutation.error,

    updateIncome: updateMutation.mutate,
    updateIncomeAsync: updateMutation.mutateAsync,
    isUpdatingIncome: updateMutation.isPending,
    updateIncomeError: updateMutation.error,

    removeIncome: deleteMutation.mutate,
    removeIncomeAsync: deleteMutation.mutateAsync,
    isRemovingIncome: deleteMutation.isPending,
    removeIncomeError: deleteMutation.error,
  };
};
