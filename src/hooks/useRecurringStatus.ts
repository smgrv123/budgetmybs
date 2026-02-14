import { getProcessedRecurringByMonth } from '@/db/queries/expenses';
import { getCurrentMonth } from '@/db/utils';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get recurring transaction status for a given month
 * Returns processed items and a helper to check if a specific item is processed
 */
export const useRecurringStatus = (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const { data: processedItems = [], ...queryInfo } = useQuery({
    queryKey: ['recurring-status', targetMonth],
    queryFn: () => getProcessedRecurringByMonth(targetMonth),
  });

  /**
   * Helper to check if a specific recurring item has been processed
   */
  const isItemProcessed = (sourceType: string, sourceId: string): boolean => {
    return processedItems.some((item) => item.sourceType === sourceType && item.sourceId === sourceId);
  };

  return {
    processedItems,
    isItemProcessed,
    ...queryInfo,
  };
};
