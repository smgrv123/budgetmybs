import type { IncomeType } from '@/db/types';

export type IncomeEntryData = {
  tempId: string;
  amount: number;
  type: IncomeType;
  customType?: string;
  description?: string;
  date: string;
};
