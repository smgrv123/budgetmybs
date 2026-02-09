import type { ThemeColors } from '@/hooks/use-theme-color';
import {
  BudgetValueKey,
  FinancialDataKey,
  type BudgetOverviewItem,
  type FinancialDataItem,
} from '@/src/types/settings';

export const createFinancialDataItems = (themeColors: ThemeColors): FinancialDataItem[] => [
  {
    key: FinancialDataKey.FIXED_EXPENSES,
    label: 'Fixed Expenses',
    icon: 'document-text-outline',
    iconBgColor: themeColors.recommendationBg,
    iconColor: themeColors.primary,
    route: '/dashboard/settings/fixed-expenses',
  },
  {
    key: FinancialDataKey.DEBTS,
    label: 'Debts & Loans',
    icon: 'card-outline',
    iconBgColor: themeColors.warningBackground,
    iconColor: themeColors.warning,
    route: '/dashboard/settings/debts',
  },
  {
    key: FinancialDataKey.SAVINGS,
    label: 'Savings Goals',
    icon: 'wallet-outline',
    iconBgColor: themeColors.successBackground,
    iconColor: themeColors.success,
    route: '/dashboard/settings/savings',
  },
];

export const BUDGET_OVERVIEW_ITEMS: BudgetOverviewItem[] = [
  { key: 'income', label: 'Monthly Income', valueKey: BudgetValueKey.SALARY },
  { key: 'fixed', label: 'Fixed Expenses', valueKey: BudgetValueKey.FIXED_EXPENSES, isNegative: true },
  { key: 'debt', label: 'Debt Payments', valueKey: BudgetValueKey.DEBT_PAYMENTS, isNegative: true },
];
