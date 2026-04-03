import type { Href } from 'expo-router';

export const FinancialDataKey = {
  FIXED_EXPENSES: 'fixedExpenses',
  DEBTS: 'debts',
  SAVINGS: 'savings',
  CREDIT_CARDS: 'creditCards',
} as const;
export type FinancialDataKeyType = (typeof FinancialDataKey)[keyof typeof FinancialDataKey];

export const BudgetValueKey = {
  SALARY: 'salary',
  FIXED_EXPENSES: 'fixedExpenses',
  DEBT_PAYMENTS: 'debtPayments',
  ADDITIONAL_INCOME: 'additionalIncome',
} as const;
export type BudgetValueKeyType = (typeof BudgetValueKey)[keyof typeof BudgetValueKey];

export type FinancialDataItem = {
  key: FinancialDataKeyType;
  label: string;
  countSuffix?: string;
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
  hideWhenZero?: boolean;
};
