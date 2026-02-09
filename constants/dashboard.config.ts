import type { ThemeColors } from '@/hooks/use-theme-color';

/**
 * Dashboard stat card item interface
 */
export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  color: string;
}

/**
 * Dashboard quick stat item interface
 */
export interface QuickStatItem {
  id: string;
  icon: string;
  value: string;
  label: string;
  color: string;
}

/**
 * Create stat cards data based on calculated values
 */
export const createStatCards = (
  spentThisMonth: number,
  savedThisMonth: number,
  themeColors: ThemeColors
): StatCardItem[] => [
  {
    id: 'spent',
    label: 'Spent',
    value: `₹${spentThisMonth.toLocaleString('en-IN')}`,
    color: themeColors.error,
  },
  {
    id: 'saved',
    label: 'Saved',
    value: `₹${savedThisMonth.toLocaleString('en-IN')}`,
    color: themeColors.success,
  },
];

/**
 * Create quick stats data based on calculated values
 */
export const createQuickStats = (
  totalFixedExpenses: number,
  totalEMI: number,
  goalsCount: number,
  themeColors: ThemeColors
): QuickStatItem[] => [
  {
    id: 'fixed',
    icon: 'receipt-outline',
    value: `₹${totalFixedExpenses.toLocaleString('en-IN')}`,
    label: 'Fixed',
    color: themeColors.primary,
  },
  {
    id: 'emis',
    icon: 'card-outline',
    value: `₹${totalEMI.toLocaleString('en-IN')}`,
    label: 'EMIs',
    color: themeColors.warning,
  },
  {
    id: 'goals',
    icon: 'flag-outline',
    value: String(goalsCount),
    label: 'Goals',
    color: themeColors.success,
  },
];

/**
 * Placeholder recent transactions data
 */
export const RECENT_TRANSACTIONS = [
  { id: '1', name: 'Grocery Shopping', category: 'Essentials', amount: 1200, date: 'Today' },
  { id: '2', name: 'Movie Tickets', category: 'Entertainment', amount: 450, date: 'Yesterday', isImpulse: true },
  { id: '3', name: 'Electricity Bill', category: 'Utilities', amount: 1800, date: '5 Jan' },
  { id: '4', name: 'Coffee', category: 'Food', amount: 180, date: '4 Jan', isImpulse: true },
];

export interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  isImpulse?: boolean;
}
