import { Colors } from '@/constants/theme';
import {
  BudgetValueKey,
  FinancialDataKey,
  type BudgetOverviewItem,
  type FinancialDataItem,
} from '@/src/types/settings';

export const FINANCIAL_DATA_ITEMS: FinancialDataItem[] = [
  {
    key: FinancialDataKey.FIXED_EXPENSES,
    label: 'Fixed Expenses',
    icon: 'document-text-outline',
    iconBgColor: Colors.light.recommendationBg,
    iconColor: Colors.light.primary,
    route: '/dashboard/settings/fixed-expenses',
  },
  {
    key: FinancialDataKey.DEBTS,
    label: 'Debts & Loans',
    icon: 'card-outline',
    iconBgColor: Colors.light.warningBackground,
    iconColor: Colors.light.warning,
    route: '/dashboard/settings/debts',
  },
  {
    key: FinancialDataKey.SAVINGS,
    label: 'Savings Goals',
    icon: 'wallet-outline',
    iconBgColor: Colors.light.successBackground,
    iconColor: Colors.light.success,
    route: '/dashboard/settings/savings',
  },
];

export const BUDGET_OVERVIEW_ITEMS: BudgetOverviewItem[] = [
  { key: 'income', label: 'Monthly Income', valueKey: BudgetValueKey.SALARY },
  { key: 'fixed', label: 'Fixed Expenses', valueKey: BudgetValueKey.FIXED_EXPENSES, isNegative: true },
  { key: 'debt', label: 'Debt Payments', valueKey: BudgetValueKey.DEBT_PAYMENTS, isNegative: true },
];
