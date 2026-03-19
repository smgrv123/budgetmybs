import type { DropdownOption } from '@/src/types';
import type { ReactNode } from 'react';

export const TransactionFieldType = {
  INPUT: 'input',
  CATEGORY_GRID: 'categoryGrid',
  DROPDOWN: 'dropdown',
  DATE: 'date',
} as const;
export type TransactionFieldTypeValue = (typeof TransactionFieldType)[keyof typeof TransactionFieldType];

export const TransactionFieldKey = {
  AMOUNT: 'amount',
  CATEGORY: 'category',
  CREDIT_CARD: 'creditCard',
  SAVINGS_TYPE: 'savingsType',
  DESCRIPTION: 'description',
  DATE: 'date',
} as const;
export type TransactionFieldKeyValue = (typeof TransactionFieldKey)[keyof typeof TransactionFieldKey];

export const TransactionKeyboardType = {
  DEFAULT: 'default',
  DECIMAL_PAD: 'decimal-pad',
} as const;
export type TransactionKeyboardTypeValue = (typeof TransactionKeyboardType)[keyof typeof TransactionKeyboardType];

export type TransactionFieldConfig = {
  key: TransactionFieldKeyValue;
  type: TransactionFieldTypeValue;
  label: string;
  placeholder?: string;
  modalTitle?: string;
  keyboardType?: TransactionKeyboardTypeValue;
  multiline?: boolean;
  numberOfLines?: number;
  hasCurrencyIcon?: boolean;
  options?: DropdownOption[];
};

export type TransactionField = {
  key: TransactionFieldKeyValue;
  type: TransactionFieldTypeValue;
  label: string;
  placeholder?: string;
  modalTitle?: string;
  value: string;
  onValueChange: (value: string | number) => void;
  keyboardType?: TransactionKeyboardTypeValue;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: ReactNode;
  options?: DropdownOption[];
  error?: string;
};
