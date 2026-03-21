import { fetchFriendBalances } from '@/src/services/splitwiseBalances';
import { useQuery } from '@tanstack/react-query';

export const SPLITWISE_BALANCES_QUERY_KEY = ['splitwise', 'balances'] as const;

export const useSplitwiseBalances = () => {
  const query = useQuery({
    queryKey: SPLITWISE_BALANCES_QUERY_KEY,
    queryFn: fetchFriendBalances,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    totalOwed: query.data?.totalOwed ?? 0,
    totalOwing: query.data?.totalOwing ?? 0,
    friends: query.data?.friends ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
