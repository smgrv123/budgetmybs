import { createDebt, deleteDebt, getDebts, getTotalMonthlyEmi, getTotalRemainingDebt, updateDebt } from '@/db';
import type { UpdateDebtInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const DEBTS_QUERY_KEY = ['debts'] as const;
export const TOTAL_EMI_QUERY_KEY = ['debts', 'totalEmi'] as const;
export const TOTAL_REMAINING_QUERY_KEY = ['debts', 'totalRemaining'] as const;

/**
 * Hook for debts queries and mutations
 */
export const useDebts = (activeOnly = true) => {
  const queryClient = useQueryClient();

  const debtsQuery = useQuery({
    queryKey: [...DEBTS_QUERY_KEY, { activeOnly }],
    queryFn: () => getDebts(activeOnly),
  });

  const totalEmiQuery = useQuery({
    queryKey: TOTAL_EMI_QUERY_KEY,
    queryFn: getTotalMonthlyEmi,
  });

  const totalRemainingQuery = useQuery({
    queryKey: TOTAL_REMAINING_QUERY_KEY,
    queryFn: getTotalRemainingDebt,
  });

  const createMutation = useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBTS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDebtInput }) => updateDebt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBTS_QUERY_KEY });
    },
  });

  return {
    // Query state
    debts: debtsQuery.data ?? [],
    totalMonthlyEmi: totalEmiQuery.data ?? 0,
    totalRemainingDebt: totalRemainingQuery.data ?? 0,
    isDebtsLoading: debtsQuery.isLoading,
    isDebtsError: debtsQuery.isError,
    debtsError: debtsQuery.error,
    refetchDebts: debtsQuery.refetch,

    // Mutations
    createDebt: createMutation.mutate,
    createDebtAsync: createMutation.mutateAsync,
    isCreatingDebt: createMutation.isPending,

    updateDebt: updateMutation.mutate,
    updateDebtAsync: updateMutation.mutateAsync,
    isUpdatingDebt: updateMutation.isPending,

    removeDebt: deleteMutation.mutate,
    removeDebtAsync: deleteMutation.mutateAsync,
    isRemovingDebt: deleteMutation.isPending,
  };
};
