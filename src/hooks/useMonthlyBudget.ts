import { getMonthlyIncomeSum, getMonthlySnapshot, resetRollover as resetRolloverQuery } from '@/db';
import { getCurrentMonth } from '@/db/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MONTHLY_INCOME_SUM_QUERY_KEY } from './useIncome';

export const MONTHLY_BUDGET_QUERY_KEY = ['monthlyBudget'] as const;

export const useMonthlyBudget = (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: [...MONTHLY_BUDGET_QUERY_KEY, targetMonth],
    queryFn: () => getMonthlySnapshot(targetMonth),
  });

  const incomeSumQuery = useQuery({
    queryKey: [...MONTHLY_INCOME_SUM_QUERY_KEY, { month: targetMonth }],
    queryFn: () => getMonthlyIncomeSum(targetMonth),
  });

  const resetRolloverMutation = useMutation({
    mutationFn: () => resetRolloverQuery(targetMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_BUDGET_QUERY_KEY });
    },
  });

  return {
    snapshot: snapshotQuery.data ?? null,
    rollover: snapshotQuery.data?.rolloverFromPrevious ?? 0,
    additionalIncome: incomeSumQuery.data ?? 0,
    isSnapshotLoading: snapshotQuery.isLoading,
    refetchSnapshot: snapshotQuery.refetch,

    resetRollover: resetRolloverMutation.mutate,
    isResettingRollover: resetRolloverMutation.isPending,
  };
};
