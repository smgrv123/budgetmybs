/**
 * useSplitwiseSync
 *
 * TanStack Query hook for the Splitwise inbound sync pipeline.
 *
 * Exposes:
 *  - syncSplitwise(options?) / syncSplitwiseAsync(options?) mutation
 *  - isSyncing state
 *  - lastSyncedAt (read from AsyncStorage, kept fresh via query)
 *  - triggerStaleGatedSync() — runs sync only if last sync was >5 min ago
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EXPENSES_QUERY_KEY, ONE_OFF_SAVINGS_QUERY_KEY, TOTAL_SPENT_QUERY_KEY } from '@/src/hooks/queryKeys';
import { getLastSyncedAt, syncSplitwiseExpenses } from '@/src/services/splitwise';
import type { SplitwiseSyncResult } from '@/src/types/splitwise';
import { SPLITWISE_STALE_THRESHOLD_MS } from '@/src/constants/splitwise.config';
import { ALL_EXPENSES_QUERY_KEY } from '@/src/hooks/useAllExpenses';
import { SPLITWISE_FRIEND_BALANCES_QUERY_KEY } from '@/src/hooks/useSplitwiseBalances';

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_LAST_SYNCED_AT_QUERY_KEY = ['splitwise', 'lastSyncedAt'] as const;

// ============================================
// HOOK
// ============================================

export const useSplitwiseSync = () => {
  const queryClient = useQueryClient();

  // ── Last synced at query ──────────────────────────────────────────────────
  // Reads the cached ISO timestamp from AsyncStorage.
  const lastSyncedAtQuery = useQuery({
    queryKey: SPLITWISE_LAST_SYNCED_AT_QUERY_KEY,
    queryFn: getLastSyncedAt,
    staleTime: 0,
  });

  const lastSyncedAt: string | null = lastSyncedAtQuery.data ?? null;

  // ── Sync mutation ─────────────────────────────────────────────────────────
  const syncMutation = useMutation<SplitwiseSyncResult, Error, { fullSync?: boolean } | undefined>({
    mutationFn: (options) => syncSplitwiseExpenses(options ?? {}),
    onSuccess: async () => {
      // Invalidate expense queries so UI refreshes with new data
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ONE_OFF_SAVINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ALL_EXPENSES_QUERY_KEY });
      // Refresh the last-synced-at display
      queryClient.invalidateQueries({ queryKey: SPLITWISE_LAST_SYNCED_AT_QUERY_KEY });
      // Let useSplitwiseBalances refetch naturally when its cache goes stale
      queryClient.invalidateQueries({ queryKey: SPLITWISE_FRIEND_BALANCES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwiseSync] Sync failed:', error);
    },
  });

  // ── Stale-gated sync ──────────────────────────────────────────────────────
  /**
   * Triggers a sync only if the last sync was more than SPLITWISE_STALE_THRESHOLD_MS ago.
   * Intended for dashboard mount.
   */
  const triggerStaleGatedSync = async () => {
    if (syncMutation.isPending) return;

    const cached = await getLastSyncedAt();
    if (cached) {
      const msSinceLastSync = Date.now() - new Date(cached).getTime();
      if (msSinceLastSync < SPLITWISE_STALE_THRESHOLD_MS) {
        return; // Not stale yet
      }
    }

    syncMutation.mutate({});
  };

  return {
    // Sync mutation
    syncSplitwise: syncMutation.mutate,
    syncSplitwiseAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    lastSyncResult: syncMutation.data ?? null,

    // Last synced at
    lastSyncedAt,
    isLastSyncedAtLoading: lastSyncedAtQuery.isLoading,

    // Stale-gated auto-sync for dashboard mount
    triggerStaleGatedSync,
  };
};
