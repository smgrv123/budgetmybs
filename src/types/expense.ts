import type { CreditCardProvider, CreditCardTxnType } from '@/db/types';
import { TransactionType, type TransactionTypeValue } from '@/src/constants/theme';

// ─── Unified expense/saving row returned from getAllExpensesWithCategory ───────
export type AllExpense = {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  wasImpulse: number | null;
  isSaving: number;
  savingsType: string | null;
  categoryId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  creditCardId: string | null;
  creditCardTxnType: CreditCardTxnType | null;
  createdAt: string | null;
  category: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  } | null;
  creditCard: {
    nickname: string;
    last4: string;
    provider: CreditCardProvider;
  } | null;
  isFromSplitwise: number;
  transactionType: TransactionTypeValue;
};

// ─── FlatList item types (section headers + transaction rows) ─────────────────
export type TransactionListSectionHeader = {
  type: 'sectionHeader';
  title: string; // e.g. "March 2026"
  month: string; // e.g. "2026-03"
  total: number; // sum of expenses in this month (savings excluded)
};

export type TransactionListTransaction = {
  type: 'transaction';
  data: AllExpense;
};

export type TransactionListItem = TransactionListSectionHeader | TransactionListTransaction;

// ─── Filter state ─────────────────────────────────────────────────────────────
export type ExpenseFilter = {
  categoryId: string | null;
  creditCardId: string | null;
  startDate: string;
  endDate: string;
  type: ExpenseFilterTypeValue;
};

export const ExpenseFilterType = {
  ALL: 'all',
  EXPENSE: TransactionType.EXPENSE,
  SAVING: TransactionType.SAVING,
  IMPULSE: 'impulse',
} as const;
export type ExpenseFilterTypeValue = (typeof ExpenseFilterType)[keyof typeof ExpenseFilterType];

export const DEFAULT_EXPENSE_FILTER: ExpenseFilter = {
  categoryId: null,
  creditCardId: null,
  startDate: '',
  endDate: '',
  type: ExpenseFilterType.ALL,
};
