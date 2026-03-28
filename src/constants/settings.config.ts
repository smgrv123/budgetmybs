import { CREDIT_CARD_ICON_NAMES } from '@/src/constants/credit-cards.config';
import { INCOME_SETTINGS_STRINGS } from '@/src/constants/income.strings';
import {
  CREDIT_CARDS_SETTINGS_STRINGS,
  DEBTS_SETTINGS_STRINGS,
  FIXED_EXPENSES_SETTINGS_STRINGS,
  SAVINGS_SETTINGS_STRINGS,
} from '@/src/constants/settings.strings';
import type { ThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import {
  BudgetValueKey,
  FinancialDataKey,
  type BudgetOverviewItem,
  type FinancialDataItem,
} from '@/src/types/settings';

export const createFinancialDataItems = (themeColors: ThemeColors): FinancialDataItem[] => [
  {
    key: FinancialDataKey.FIXED_EXPENSES,
    label: FIXED_EXPENSES_SETTINGS_STRINGS.screenTitle,
    icon: 'document-text-outline',
    iconBgColor: themeColors.recommendationBg,
    iconColor: themeColors.primary,
    route: '/settings/fixed-expenses',
  },
  {
    key: FinancialDataKey.DEBTS,
    label: DEBTS_SETTINGS_STRINGS.screenTitle,
    icon: 'card-outline',
    iconBgColor: themeColors.warningBackground,
    iconColor: themeColors.warning,
    route: '/settings/debts',
  },
  {
    key: FinancialDataKey.SAVINGS,
    label: SAVINGS_SETTINGS_STRINGS.screenTitle,
    icon: 'wallet-outline',
    iconBgColor: themeColors.successBackground,
    iconColor: themeColors.success,
    route: '/settings/savings',
  },
  {
    key: FinancialDataKey.CREDIT_CARDS,
    label: CREDIT_CARDS_SETTINGS_STRINGS.manageCardsLabel,
    countSuffix: CREDIT_CARDS_SETTINGS_STRINGS.cardsLinkedSuffix,
    icon: CREDIT_CARD_ICON_NAMES.card,
    iconBgColor: themeColors.primaryFaded,
    iconColor: themeColors.primary,
    route: '/settings/credit-cards',
  },
  {
    key: FinancialDataKey.INCOME,
    label: INCOME_SETTINGS_STRINGS.screenTitle,
    icon: 'cash-outline',
    iconBgColor: themeColors.successBackground,
    iconColor: themeColors.success,
    route: '/settings/income',
  },
];

export const BUDGET_OVERVIEW_ITEMS: BudgetOverviewItem[] = [
  { key: 'income', label: 'Monthly Income', valueKey: BudgetValueKey.SALARY },
  {
    key: 'additionalIncome',
    label: 'Additional Income',
    valueKey: BudgetValueKey.ADDITIONAL_INCOME,
    hideWhenZero: true,
  },
  { key: 'fixed', label: 'Fixed Expenses', valueKey: BudgetValueKey.FIXED_EXPENSES, isNegative: true },
  { key: 'debt', label: 'Debt Payments', valueKey: BudgetValueKey.DEBT_PAYMENTS, isNegative: true },
];
