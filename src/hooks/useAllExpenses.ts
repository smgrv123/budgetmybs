import { getAllExpensesWithCategory } from '@/db';
import { TransactionType } from '@/src/constants/theme';
import type { AllExpense, ExpenseFilter, ExpenseSection } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER } from '@/src/types';
import { formatMonthLabel } from '@/src/utils/date';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const ALL_EXPENSES_QUERY_KEY = ['allExpenses'] as const;

export const useAllExpenses = (filter: ExpenseFilter = DEFAULT_EXPENSE_FILTER) => {
  // NOTE: queryKey is static because filtering is entirely client-side via useMemo.
  // The DB is SQLite (local) — we fetch all data once, no network calls.
  // If filtering ever moves to the DB layer, include `filter` in the key.
  const query = useQuery({
    queryKey: ALL_EXPENSES_QUERY_KEY,
    queryFn: getAllExpensesWithCategory,
  });

  // Split into typed AllExpense rows
  const allExpenses: AllExpense[] = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        ...row,
        transactionType: row.isSaving === 1 ? TransactionType.SAVING : TransactionType.EXPENSE,
      })),
    [query.data]
  );

  // Apply filters client-side
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((item) => {
      if (filter.type !== 'all' && item.transactionType !== filter.type) return false;
      if (filter.categoryId && item.categoryId !== filter.categoryId) return false;
      if (filter.startDate && item.date < filter.startDate) return false;
      if (filter.endDate && item.date > filter.endDate) return false;
      return true;
    });
  }, [allExpenses, filter]);

  // Group by YYYY-MM for SectionList
  const sections: ExpenseSection[] = useMemo(() => {
    const map = new Map<string, AllExpense[]>();

    for (const item of filteredExpenses) {
      const month = item.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(item);
    }

    return Array.from(map.entries()).map(([month, data]) => ({
      title: formatMonthLabel(month),
      month,
      total: data.filter((t) => t.transactionType === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
      data,
    }));
  }, [filteredExpenses]);

  const hasActiveFilter =
    filter.categoryId !== null || filter.startDate !== '' || filter.endDate !== '' || filter.type !== 'all';

  return {
    filteredExpenses,
    sections,
    hasActiveFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
