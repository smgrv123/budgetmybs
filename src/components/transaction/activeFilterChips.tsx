import type { FC } from 'react';

import type { Category, CreditCard } from '@/db/schema-types';
import { BView, FilterChip } from '@/src/components/ui';
import { ALL_TRANSACTIONS_STRINGS, TRANSACTION_COMMON_STRINGS } from '@/src/constants/transactions.strings';
import { SpacingValue } from '@/src/constants/theme';
import type { ExpenseFilter } from '@/src/types';
import { ExpenseFilterType } from '@/src/types';

export interface ActiveFilterChipsProps {
  filter: ExpenseFilter;
  onUpdateFilter: (updater: (prev: ExpenseFilter) => ExpenseFilter) => void;
  categories: Category[];
  creditCards?: CreditCard[];
}

const ActiveFilterChips: FC<ActiveFilterChipsProps> = ({ filter, onUpdateFilter, categories, creditCards = [] }) => {
  const hasActiveFilter =
    filter.categoryId !== null ||
    filter.creditCardId !== null ||
    filter.startDate !== '' ||
    filter.endDate !== '' ||
    filter.type !== ExpenseFilterType.ALL;

  if (!hasActiveFilter) return null;

  return (
    <BView row gap={SpacingValue.XS} paddingX={SpacingValue.LG} paddingY={SpacingValue.XS} style={{ flexWrap: 'wrap' }}>
      {filter.type !== ExpenseFilterType.ALL && (
        <FilterChip
          label={
            filter.type === ExpenseFilterType.EXPENSE
              ? ALL_TRANSACTIONS_STRINGS.expensesOnlyChip
              : filter.type === ExpenseFilterType.SAVING
                ? ALL_TRANSACTIONS_STRINGS.savingsOnlyChip
                : ALL_TRANSACTIONS_STRINGS.impulseOnlyChip
          }
          onRemove={() => onUpdateFilter((f) => ({ ...f, type: ExpenseFilterType.ALL }))}
        />
      )}
      {filter.categoryId && (
        <FilterChip
          icon="pricetag-outline"
          label={
            categories.find((c) => c.id === filter.categoryId)?.name ?? TRANSACTION_COMMON_STRINGS.categoryFallback
          }
          onRemove={() => onUpdateFilter((f) => ({ ...f, categoryId: null }))}
        />
      )}
      {filter.creditCardId && (
        <FilterChip
          icon="card-outline"
          label={
            creditCards.find((c) => c.id === filter.creditCardId)?.nickname ?? ALL_TRANSACTIONS_STRINGS.cardPlaceholder
          }
          onRemove={() => onUpdateFilter((f) => ({ ...f, creditCardId: null }))}
        />
      )}
      {(filter.startDate || filter.endDate) && (
        <FilterChip
          icon="calendar-outline"
          label={[filter.startDate, filter.endDate].filter(Boolean).join(' – ')}
          onRemove={() => onUpdateFilter((f) => ({ ...f, startDate: '', endDate: '' }))}
        />
      )}
    </BView>
  );
};

export default ActiveFilterChips;
