import { Colors } from '@/constants/theme';
import type { QuickStatItem, StatCardItem } from '@/src/types/dashboard';

/**
 * Quick stat types
 */
export const QuickStatType = {
  FIXED: 'fixed',
  EMIS: 'emis',
  GOALS: 'goals',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
} as const;

/**
 * Stat card types
 */
export const StatCardType = {
  SPENT: 'spent',
  SAVED: 'saved',
} as const;

/**
 * Create stat cards for spent and saved amounts
 */
export const createStatCards = (spentAmount: number, savedAmount: number): StatCardItem[] => [
  {
    id: StatCardType.SPENT,
    label: 'Spent',
    value: `₹${spentAmount.toLocaleString('en-IN')}`,
    color: Colors.light.error,
  },
  {
    id: StatCardType.SAVED,
    label: 'Saved',
    value: `₹${savedAmount.toLocaleString('en-IN')}`,
    color: Colors.light.success,
  },
];

/**
 * Create quick stats for dashboard
 */
export const createQuickStats = (
  totalFixedExpenses: number,
  fixedExpensesCount: number,
  totalEMI: number,
  debtsCount: number,
  completedGoalsCount: number,
  incompleteGoalsCount: number
): QuickStatItem[] => [
  {
    id: QuickStatType.FIXED,
    icon: 'receipt-outline',
    value: `₹${totalFixedExpenses.toLocaleString('en-IN')}`,
    label: 'Fixed',
    color: Colors.light.primary,
    count: fixedExpensesCount,
  },
  {
    id: QuickStatType.EMIS,
    icon: 'card-outline',
    value: `₹${totalEMI.toLocaleString('en-IN')}`,
    label: 'EMIs',
    color: Colors.light.warning,
    count: debtsCount,
  },
  {
    id: QuickStatType.COMPLETED,
    icon: 'checkmark-circle-outline',
    value: String(completedGoalsCount),
    label: 'Completed',
    color: Colors.light.success,
    count: completedGoalsCount,
  },
  {
    id: QuickStatType.INCOMPLETE,
    icon: 'flag-outline',
    value: String(incompleteGoalsCount),
    label: 'Goals',
    color: Colors.light.textMuted,
    count: incompleteGoalsCount,
  },
];
