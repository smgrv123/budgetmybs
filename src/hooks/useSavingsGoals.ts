import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  getTotalMonthlySavingsTarget,
  updateSavingsGoal,
} from '@/db';
import type { UpdateSavingsGoalInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SAVINGS_GOALS_QUERY_KEY = ['savingsGoals'] as const;
export const TOTAL_SAVINGS_TARGET_QUERY_KEY = ['savingsGoals', 'totalTarget'] as const;

/**
 * Hook for savings goals queries and mutations
 */
export const useSavingsGoals = (activeOnly = true) => {
  const queryClient = useQueryClient();

  const savingsGoalsQuery = useQuery({
    queryKey: [...SAVINGS_GOALS_QUERY_KEY, { activeOnly }],
    queryFn: () => getSavingsGoals(activeOnly),
  });

  const totalTargetQuery = useQuery({
    queryKey: TOTAL_SAVINGS_TARGET_QUERY_KEY,
    queryFn: getTotalMonthlySavingsTarget,
  });

  const createMutation = useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavingsGoalInput }) => updateSavingsGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
    },
  });

  return {
    // Query state
    savingsGoals: savingsGoalsQuery.data ?? [],
    totalSavingsTarget: totalTargetQuery.data ?? 0,
    isSavingsGoalsLoading: savingsGoalsQuery.isLoading,
    isSavingsGoalsError: savingsGoalsQuery.isError,
    savingsGoalsError: savingsGoalsQuery.error,
    refetchSavingsGoals: savingsGoalsQuery.refetch,

    // Mutations
    createSavingsGoal: createMutation.mutate,
    createSavingsGoalAsync: createMutation.mutateAsync,
    isCreatingSavingsGoal: createMutation.isPending,

    updateSavingsGoal: updateMutation.mutate,
    updateSavingsGoalAsync: updateMutation.mutateAsync,
    isUpdatingSavingsGoal: updateMutation.isPending,

    removeSavingsGoal: deleteMutation.mutate,
    removeSavingsGoalAsync: deleteMutation.mutateAsync,
    isRemovingSavingsGoal: deleteMutation.isPending,
  };
};
