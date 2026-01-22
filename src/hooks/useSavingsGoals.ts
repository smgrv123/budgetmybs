import {
  createSavingsGoal,
  deleteSavingsGoal,
  getCompletedSavingsGoals,
  getIncompleteSavingsGoals,
  getSavingsGoals,
  getTotalMonthlySavingsTarget,
  markGoalAsCompleted,
  updateSavingsGoal,
} from '@/db';
import type { UpdateSavingsGoalInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SAVINGS_GOALS_QUERY_KEY = ['savingsGoals'] as const;
export const COMPLETED_GOALS_QUERY_KEY = ['savingsGoals', 'completed'] as const;
export const INCOMPLETE_GOALS_QUERY_KEY = ['savingsGoals', 'incomplete'] as const;
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

  const completedGoalsQuery = useQuery({
    queryKey: COMPLETED_GOALS_QUERY_KEY,
    queryFn: getCompletedSavingsGoals,
  });

  const incompleteGoalsQuery = useQuery({
    queryKey: INCOMPLETE_GOALS_QUERY_KEY,
    queryFn: getIncompleteSavingsGoals,
  });

  const createMutation = useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCOMPLETE_GOALS_QUERY_KEY });
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

  const markCompletedMutation = useMutation({
    mutationFn: markGoalAsCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMPLETED_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCOMPLETE_GOALS_QUERY_KEY });
    },
  });

  return {
    // Query state
    savingsGoals: savingsGoalsQuery.data ?? [],
    completedGoals: completedGoalsQuery.data ?? [],
    incompleteGoals: incompleteGoalsQuery.data ?? [],
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

    markGoalAsCompleted: markCompletedMutation.mutate,
    markGoalAsCompletedAsync: markCompletedMutation.mutateAsync,
    isMarkingGoalAsCompleted: markCompletedMutation.isPending,
  };
};
