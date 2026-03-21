import { getAllExpensesWithCategory } from '@/db';
import { TransactionType } from '@/src/constants/theme';
import type { AllExpense, ExpenseFilter, TransactionListItem } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER, ExpenseFilterType } from '@/src/types';
import { formatMonthLabel } from '@/src/utils/date';
import { useInfiniteQuery } from '@tanstack/react-query';

export const ALL_EXPENSES_QUERY_KEY = ['allExpenses'] as const;

const PAGE_SIZE = 30;

export const useAllExpenses = (filter: ExpenseFilter = DEFAULT_EXPENSE_FILTER) => {
  const isSavingParam =
    filter.type === ExpenseFilterType.ALL ? undefined : filter.type === ExpenseFilterType.SAVING ? 1 : 0;

  const query = useInfiniteQuery({
    queryKey: [...ALL_EXPENSES_QUERY_KEY, filter],
    queryFn: ({ pageParam }) =>
      getAllExpensesWithCategory({
        categoryId: filter.categoryId ?? undefined,
        creditCardId: filter.creditCardId ?? undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        isSaving: isSavingParam,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });

  const allExpenses: AllExpense[] = (query.data?.pages ?? []).flatMap((page) =>
    page.map((row) => ({
      ...row,
      transactionType: row.isSaving === 1 ? TransactionType.SAVING : TransactionType.EXPENSE,
    }))
  );

  const monthTotals = new Map<string, number>();
  for (const expense of allExpenses) {
    if (expense.transactionType === TransactionType.EXPENSE) {
      const month = expense.date.slice(0, 7);
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + expense.amount);
    }
  }

  const items: TransactionListItem[] = [];
  let currentMonth = '';
  for (const expense of allExpenses) {
    const month = expense.date.slice(0, 7);
    if (month !== currentMonth) {
      currentMonth = month;
      items.push({
        type: 'sectionHeader',
        title: formatMonthLabel(month),
        month,
        total: monthTotals.get(month) ?? 0,
      });
    }
    items.push({ type: 'transaction', data: expense });
  }

  const hasActiveFilter =
    filter.categoryId !== null ||
    filter.creditCardId !== null ||
    filter.startDate !== '' ||
    filter.endDate !== '' ||
    filter.type !== 'all';

  return {
    items,
    hasActiveFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};
