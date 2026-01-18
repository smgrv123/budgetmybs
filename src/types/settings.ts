import type { Href } from 'expo-router';

export const FinancialDataKey = {
  FIXED_EXPENSES: 'fixedExpenses',
  DEBTS: 'debts',
  SAVINGS: 'savings',
} as const;
export type FinancialDataKeyType = (typeof FinancialDataKey)[keyof typeof FinancialDataKey];

export const BudgetValueKey = {
  SALARY: 'salary',
  FIXED_EXPENSES: 'fixedExpenses',
  DEBT_PAYMENTS: 'debtPayments',
} as const;
export type BudgetValueKeyType = (typeof BudgetValueKey)[keyof typeof BudgetValueKey];

export type FinancialDataItem = {
  key: FinancialDataKeyType;
  label: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  route: Href;
};

export type BudgetOverviewItem = {
  key: string;
  label: string;
  valueKey: BudgetValueKeyType;
  isNegative?: boolean;
};
