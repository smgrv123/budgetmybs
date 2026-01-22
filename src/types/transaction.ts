import type { DropdownOption } from '@/src/types';
import type { ReactNode } from 'react';

export type TransactionFieldType = 'input' | 'categoryGrid' | 'dropdown' | 'date';

export type TransactionFieldConfig = {
  key: string;
  type: TransactionFieldType;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  hasCurrencyIcon?: boolean;
  options?: DropdownOption[];
};

export type TransactionField = {
  key: string;
  type: TransactionFieldType;
  label: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string | number) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: ReactNode;
  options?: DropdownOption[];
  error?: string;
};
