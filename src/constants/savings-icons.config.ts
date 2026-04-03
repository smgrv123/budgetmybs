import type { SavingsType } from '@/db/types';

/**
 * Maps each SavingsType to an Ionicons icon name.
 * Used in savings goal cards on the overview tab.
 */
export const SAVINGS_TYPE_ICONS: Record<SavingsType, string> = {
  fd: 'lock-closed-outline',
  rd: 'repeat-outline',
  mutual_funds: 'trending-up-outline',
  stocks: 'bar-chart-outline',
  ppf: 'shield-outline',
  nps: 'people-outline',
  gold: 'diamond-outline',
  crypto: 'logo-bitcoin',
  emergency_fund: 'medkit-outline',
  other: 'wallet-outline',
};
