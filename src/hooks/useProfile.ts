import { getProfile, upsertProfile } from '@/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query key for profile
export const PROFILE_QUERY_KEY = ['profile'] as const;

/**
 * Hook for profile queries and mutations
 */
export const useProfile = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  });

  const upsertProfileMutation = useMutation({
    mutationFn: upsertProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  return {
    // Query state
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    isProfileError: profileQuery.isError,
    profileError: profileQuery.error,
    refetchProfile: profileQuery.refetch,

    // Mutations
    upsertProfile: upsertProfileMutation.mutate,
    upsertProfileAsync: upsertProfileMutation.mutateAsync,
    isUpsertingProfile: upsertProfileMutation.isPending,
    upsertProfileError: upsertProfileMutation.error,
  };
};
