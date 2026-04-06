/**
 * useFormOptionSources
 *
 * Calls all data hooks unconditionally and returns a string-keyed map of
 * picker options. TanStack Query's deduplication means this is free —
 * results are shared with any other hook already querying the same keys.
 */
import { IncomeLabels, SavingsLabels, USER_INCOME_TYPES, SAVINGS_TYPES } from '@/db/types';
import { useCategories } from './useCategories';
import { useCreditCards } from './useCreditCards';
import { useSavingsGoals } from './useSavingsGoals';
import type { FormOptionSources } from '@/src/types';

const ADHOC_OPTION = { label: 'Ad-hoc', value: '__adhoc__' };

export const useFormOptionSources = (): FormOptionSources => {
  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { savingsGoals } = useSavingsGoals();

  const goalOptions = savingsGoals.map((g) => ({ label: g.name, value: g.id }));

  return {
    categories: allCategories.map((c) => ({ label: c.name, value: c.id })),
    creditCards: creditCards.map((c) => ({ label: `${c.nickname} ••${c.last4}`, value: c.id })),
    savingsGoals: goalOptions,
    savingsGoalsWithAdhoc: [...goalOptions, ADHOC_OPTION],
    incomeTypes: USER_INCOME_TYPES.map((t) => ({ label: IncomeLabels[t], value: t })),
    savingsTypes: SAVINGS_TYPES.map((t) => ({ label: SavingsLabels[t], value: t })),
  };
};
