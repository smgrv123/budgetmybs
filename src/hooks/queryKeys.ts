/**
 * Shared query keys for hooks that have cross-dependencies.
 * Extracted here to break circular imports between useExpenses and useCreditCards.
 */

export const EXPENSES_QUERY_KEY = ['expenses'] as const;
export const EXPENSE_BY_ID_QUERY_KEY = ['expenses', 'byId'] as const;
export const ONE_OFF_SAVINGS_QUERY_KEY = ['oneOffSavings'] as const;
export const TOTAL_SPENT_QUERY_KEY = ['expenses', 'totalSpent'] as const;
export const TOTAL_SAVED_QUERY_KEY = ['savings', 'totalSaved'] as const;

export const CREDIT_CARDS_QUERY_KEY = ['creditCards'] as const;
export const CREDIT_CARD_SUMMARIES_QUERY_KEY = ['creditCards', 'summaries'] as const;
