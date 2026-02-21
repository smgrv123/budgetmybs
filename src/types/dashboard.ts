import { QuickStatType, StatCardType } from '@/src/constants/dashboardData';

/**
 * Stat card item interface
 */
export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  color: string;
}

/**
 * Quick stat item interface
 */
export interface QuickStatItem {
  id: QuickStatTypeValue;
  icon: string;
  value: string;
  label: string;
  color: string;
  count: number;
}

export type StatCardTypeValue = (typeof StatCardType)[keyof typeof StatCardType];

export type QuickStatTypeValue = (typeof QuickStatType)[keyof typeof QuickStatType];
