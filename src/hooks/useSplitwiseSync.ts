import { isSplitwiseConnected } from '@/src/config/splitwise';
import { syncSplitwiseExpenses } from '@/src/services/splitwiseSync';
import { drainSplitQueue } from '@/src/services/splitwisePush';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ALL_EXPENSES_QUERY_KEY } from './useAllExpenses';
import { EXPENSES_QUERY_KEY, TOTAL_SPENT_QUERY_KEY } from './useExpenses';
import { SPLITWISE_BALANCES_QUERY_KEY } from './useSplitwiseBalances';
import { SPLITWISE_RECEIVABLES_QUERY_KEY } from './useSplitwiseReceivables';

export const useSplitwiseSync = () => {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const connected = await isSplitwiseConnected();
      if (!connected) return false;
      await syncSplitwiseExpenses();
      await drainSplitQueue();
      return true;
    },
    onSuccess: (synced) => {
      if (!synced) return;
      // Invalidate all expense-related queries so UI reflects synced data
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ALL_EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_RECEIVABLES_QUERY_KEY });
    },
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
  };
};
