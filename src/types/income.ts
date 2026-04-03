import type { IncomeType } from '@/db/types';
import type { ReactNode } from 'react';
import type { DropdownOption } from '@/src/types/ui';
import type { TransactionKeyboardTypeValue } from '@/src/types/transaction';

export type IncomeEntryData = {
  tempId: string;
  amount: number;
  type: IncomeType;
  customType?: string;
  description?: string;
  date: string;
};

export const IncomeFieldType = {
  INPUT: 'input',
  DROPDOWN: 'dropdown',
} as const;
export type IncomeFieldTypeValue = (typeof IncomeFieldType)[keyof typeof IncomeFieldType];

export const IncomeFieldKey = {
  AMOUNT: 'amount',
  TYPE: 'type',
  CUSTOM_TYPE: 'customType',
  DESCRIPTION: 'description',
  DATE: 'date',
} as const;
export type IncomeFieldKeyValue = (typeof IncomeFieldKey)[keyof typeof IncomeFieldKey];

export type IncomeFormValues = {
  amount: string;
  type: string;
  customType: string;
  description: string;
  date: string;
};

export type IncomeFieldConfig = {
  key: IncomeFieldKeyValue;
  type: IncomeFieldTypeValue;
  label: string;
  placeholder?: string;
  modalTitle?: string;
  keyboardType?: TransactionKeyboardTypeValue;
  hasCurrencyIcon?: boolean;
  searchable?: boolean;
  options?: DropdownOption[];
  showWhen?: (values: IncomeFormValues) => boolean;
};

export type IncomeField = {
  key: IncomeFieldKeyValue;
  type: IncomeFieldTypeValue;
  label: string;
  placeholder?: string;
  modalTitle?: string;
  value: string;
  onValueChange: (value: string | number) => void;
  keyboardType?: TransactionKeyboardTypeValue;
  leftIcon?: ReactNode;
  searchable?: boolean;
  options?: DropdownOption[];
  error?: string;
};
