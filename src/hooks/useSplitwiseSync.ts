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
 *  - triggerReconnectSync() — always runs a full sync (used on network reconnect)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  EXPENSES_QUERY_KEY,
  ONE_OFF_SAVINGS_QUERY_KEY,
  SPLITWISE_FRIEND_BALANCES_QUERY_KEY,
  TOTAL_SPENT_QUERY_KEY,
} from '@/src/hooks/queryKeys';
import { getLastSyncedAt, syncAfterReconnect, syncSplitwiseExpenses } from '@/src/services/splitwise';
import type { SplitwiseSyncResult } from '@/src/types/splitwise';
import { SPLITWISE_STALE_THRESHOLD_MS } from '@/src/constants/splitwise.config';
import { ALL_EXPENSES_QUERY_KEY } from '@/src/hooks/useAllExpenses';

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_LAST_SYNCED_AT_QUERY_KEY = ['splitwise', 'lastSyncedAt'] as const;

// ============================================
// TYPES
// ============================================

type SyncTriggerOptions = {
  fullSync?: boolean;
};

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

  const invalidateSyncQueries = () => {
    // Invalidate expense queries so UI refreshes with new data
    queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ONE_OFF_SAVINGS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ALL_EXPENSES_QUERY_KEY });
    // Refresh the last-synced-at display
    queryClient.invalidateQueries({ queryKey: SPLITWISE_LAST_SYNCED_AT_QUERY_KEY });
    // Let useSplitwiseBalances refetch naturally when its cache goes stale
    queryClient.invalidateQueries({ queryKey: SPLITWISE_FRIEND_BALANCES_QUERY_KEY });
  };

  // ── Sync mutation ─────────────────────────────────────────────────────────
  const syncMutation = useMutation<SplitwiseSyncResult, Error, SyncTriggerOptions | undefined>({
    mutationFn: (options) => syncSplitwiseExpenses(options ?? {}),
    onSuccess: invalidateSyncQueries,
    onError: (error) => {
      console.error('[useSplitwiseSync] Sync failed:', error);
    },
  });

  // ── Reconnect sync mutation ─────────────────────────────────────────────────
  // Routes through syncAfterReconnect (resets lastSyncedAt, forces full sync, and is
  // guarded against duplicate concurrent calls from other mounted hook instances —
  // in that case it resolves to null).
  const reconnectSyncMutation = useMutation<SplitwiseSyncResult | null, Error, void>({
    mutationFn: syncAfterReconnect,
    onSuccess: (result) => {
      // A null result means a reconnect sync was already in flight elsewhere — nothing
      // new landed, so skip invalidating (the in-flight call's own onSuccess will do it).
      if (!result) return;
      invalidateSyncQueries();
    },
    onError: (error) => {
      console.error('[useSplitwiseSync] Sync failed:', error);
    },
  });

  const isSyncing = syncMutation.isPending || reconnectSyncMutation.isPending;

  // ── Stale-gated sync ──────────────────────────────────────────────────────
  /**
   * Triggers a sync only if the last sync was more than SPLITWISE_STALE_THRESHOLD_MS ago.
   * Intended for dashboard mount.
   */
  const triggerStaleGatedSync = async () => {
    if (isSyncing) return;

    const cached = await getLastSyncedAt();
    if (cached) {
      const msSinceLastSync = Date.now() - new Date(cached).getTime();
      if (msSinceLastSync < SPLITWISE_STALE_THRESHOLD_MS) {
        return; // Not stale yet
      }
    }

    syncMutation.mutate({});
  };

  // ── Reconnect-triggered full sync ───────────────────────────────────────────
  /**
   * Triggers an unconditional full sync — used when the device regains connectivity
   * after a disconnection period (detected in useSplitwise.ts). Unlike
   * triggerStaleGatedSync, this always runs regardless of how recently the last
   * sync completed.
   */
  const triggerReconnectSync = () => {
    if (isSyncing) return;
    reconnectSyncMutation.mutate();
  };

  return {
    // Sync mutation
    syncSplitwise: syncMutation.mutate,
    syncSplitwiseAsync: syncMutation.mutateAsync,
    isSyncing,
    syncError: syncMutation.error,
    lastSyncResult: syncMutation.data ?? null,

    // Last synced at
    lastSyncedAt,
    isLastSyncedAtLoading: lastSyncedAtQuery.isLoading,

    // Stale-gated auto-sync for dashboard mount
    triggerStaleGatedSync,

    // Reconnect-gated full sync for network recovery
    triggerReconnectSync,
  };
};
