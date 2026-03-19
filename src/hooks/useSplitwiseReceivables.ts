import { getTotalUnsettledReceivables } from '@/db/queries/expenses';
import { getCurrentMonth } from '@/db/utils';
import { useQuery } from '@tanstack/react-query';

export const SPLITWISE_RECEIVABLES_QUERY_KEY = ['splitwise', 'receivables'] as const;

export const useSplitwiseReceivables = (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const query = useQuery({
    queryKey: [...SPLITWISE_RECEIVABLES_QUERY_KEY, { month: targetMonth }],
    queryFn: () => getTotalUnsettledReceivables(targetMonth),
  });

  return { totalReceivables: query.data ?? 0 };
};
