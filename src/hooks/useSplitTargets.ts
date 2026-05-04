/**
 * useSplitTargets
 *
 * Fetches Splitwise friends and groups from the API for the split form picker.
 * Only runs when Splitwise is connected.
 */

import { useQuery } from '@tanstack/react-query';

import { SPLITWISE_API_BASE_URL } from '@/src/constants/splitwise.config';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import type { SplitwiseFriendsResponse, SplitwiseGroupsResponse } from '@/src/validation/splitwisePush';
import { useSplitwise } from './useSplitwise';

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_FRIENDS_QUERY_KEY = ['splitwise', 'friends'] as const;
export const SPLITWISE_GROUPS_QUERY_KEY = ['splitwise', 'groups'] as const;

// ============================================
// FETCHERS
// ============================================

const fetchFriends = async (): Promise<SplitwiseFriendsResponse['friends']> => {
  const client = createHttpClient({ baseUrl: SPLITWISE_API_BASE_URL, authProvider: splitwiseAuth });
  const response = await client.get<SplitwiseFriendsResponse>('/get_friends');
  return response.friends;
};

const fetchGroups = async (): Promise<SplitwiseGroupsResponse['groups']> => {
  const client = createHttpClient({ baseUrl: SPLITWISE_API_BASE_URL, authProvider: splitwiseAuth });
  const response = await client.get<SplitwiseGroupsResponse>('/get_groups');
  return response.groups;
};

// ============================================
// HOOK
// ============================================

export const useSplitTargets = () => {
  const { isConnected } = useSplitwise();

  const friendsQuery = useQuery({
    queryKey: SPLITWISE_FRIENDS_QUERY_KEY,
    queryFn: fetchFriends,
    enabled: isConnected,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const groupsQuery = useQuery({
    queryKey: SPLITWISE_GROUPS_QUERY_KEY,
    queryFn: fetchGroups,
    enabled: isConnected,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    friends: friendsQuery.data ?? [],
    isFriendsLoading: friendsQuery.isLoading,
    isFriendsError: friendsQuery.isError,
    refetchFriends: friendsQuery.refetch,

    groups: groupsQuery.data ?? [],
    isGroupsLoading: groupsQuery.isLoading,
    isGroupsError: groupsQuery.isError,
    refetchGroups: groupsQuery.refetch,
  };
};
