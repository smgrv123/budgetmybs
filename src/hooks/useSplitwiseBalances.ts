/**
 * useSplitwiseBalances
 *
 * TanStack Query hook for Splitwise balance data derived from the /get_friends
 * Splitwise API. Results are cached in AsyncStorage and refreshed when stale
 * (older than SPLITWISE_STALE_THRESHOLD_MS).
 *
 * Provides:
 *  - totalOwedToYou: sum of positive netAmount entries (others owe you)
 *  - totalYouOwe: sum of absolute negative netAmount entries (you owe others)
 *  - friendBalances: per-friend breakdown mapped to SplitwiseFriendBalance shape
 *  - isBalancesLoading: loading state
 *
 * Note: getSplitwiseBalanceSummary and getSplitwiseBalancesByFriend DB queries
 * are preserved for other potential consumers but are no longer called here.
 */

import { useQuery } from '@tanstack/react-query';

import { SPLITWISE_STALE_THRESHOLD_MS } from '@/src/constants/splitwise.config';
import { fetchFriendBalances } from '@/src/services/splitwise';
import type { SplitwiseFriendBalance } from '@/db/queries/splitwiseExpenses';
import type { SplitwiseFriendBalanceEntry } from '@/src/types/splitwise';
import { isCacheStale, readFriendBalancesCache, writeFriendBalancesCache } from '@/src/utils/splitwiseBalancesCache';

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_BALANCE_SUMMARY_QUERY_KEY = ['splitwise', 'balances', 'summary'] as const;
export const SPLITWISE_BALANCE_BY_FRIEND_QUERY_KEY = ['splitwise', 'balances', 'byFriend'] as const;
export const SPLITWISE_FRIEND_BALANCES_QUERY_KEY = ['splitwise', 'friendBalances'] as const;

// ============================================
// QUERY FUNCTION
// ============================================

const loadFriendBalances = async (): Promise<SplitwiseFriendBalanceEntry[]> => {
  const cached = await readFriendBalancesCache();

  if (cached && !isCacheStale(cached.fetchedAt)) {
    return cached.friends;
  }

  const fresh = await fetchFriendBalances();
  await writeFriendBalancesCache(fresh);
  return fresh;
};

// ============================================
// MAPPERS
// ============================================

/**
 * Maps a SplitwiseFriendBalanceEntry to the SplitwiseFriendBalance shape
 * expected by existing consumers.
 */
const toFriendBalance = (entry: SplitwiseFriendBalanceEntry): SplitwiseFriendBalance => ({
  paidByUserId: String(entry.id),
  displayName: [entry.firstName, entry.lastName].filter(Boolean).join(' ') || String(entry.id),
  avatarUrl: entry.avatarUrl,
  owedToYou: entry.netAmount > 0 ? entry.netAmount : 0,
  youOwe: entry.netAmount < 0 ? Math.abs(entry.netAmount) : 0,
  netAmount: entry.netAmount,
});

// ============================================
// HOOK
// ============================================

export const useSplitwiseBalances = () => {
  const balancesQuery = useQuery({
    queryKey: SPLITWISE_FRIEND_BALANCES_QUERY_KEY,
    queryFn: loadFriendBalances,
    staleTime: SPLITWISE_STALE_THRESHOLD_MS,
  });

  const entries = balancesQuery.data ?? [];

  const totalOwedToYou = entries.reduce((sum, entry) => (entry.netAmount > 0 ? sum + entry.netAmount : sum), 0);

  const totalYouOwe = entries.reduce((sum, entry) => (entry.netAmount < 0 ? sum + Math.abs(entry.netAmount) : sum), 0);

  const friendBalances = entries.filter((entry) => entry.netAmount !== 0).map(toFriendBalance);

  const isBalancesLoading = balancesQuery.isLoading;

  return {
    totalOwedToYou,
    totalYouOwe,
    friendBalances,
    isBalancesLoading,
    // Alias kept for consumers that destructure the old name
    isFriendBalancesLoading: isBalancesLoading,
  };
};
