import { createElement } from 'react';

import { TRANSACTION_MODAL_TEXT } from '@/src/constants/transactionModal';
import type { DropdownOption } from '@/src/types';
import type { TransactionField, TransactionFieldConfig, TransactionFieldKeyValue } from '@/src/types/transaction';
import { BText } from '../ui';

type CreateTransactionFieldsParams = {
  configs: TransactionFieldConfig[];
  values: {
    amount: string;
    category: string;
    creditCard: string;
    savingsType: string;
    description: string;
    date: string;
  };
  handleChange: (key: TransactionFieldKeyValue, value: string) => void;
  optionsByKey?: Partial<Record<TransactionFieldKeyValue, DropdownOption[]>>;
};

export const createTransactionFields = ({
  configs,
  values,
  handleChange,
  optionsByKey,
}: CreateTransactionFieldsParams): TransactionField[] => {
  const currencyIcon = createElement(BText, { muted: true }, TRANSACTION_MODAL_TEXT.common.currency);

  return configs.map((config) => ({
    key: config.key,
    type: config.type,
    label: config.label,
    placeholder: config.placeholder,
    modalTitle: config.modalTitle,
    value: values[config.key as keyof typeof values] || '',
    onValueChange: (value: string | number) => handleChange(config.key, String(value)),
    keyboardType: config.keyboardType,
    multiline: config.multiline,
    numberOfLines: config.numberOfLines,
    leftIcon: config.hasCurrencyIcon ? currencyIcon : undefined,
    options: config.options ?? optionsByKey?.[config.key],
  }));
};
