import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/constants/transactionModal';
import { SavingsLabels, SavingsTypeEnum } from '@/db/types';
import type { TransactionFieldConfig } from '@/src/types/transaction';

export const EXPENSE_FIELD_CONFIGS: TransactionFieldConfig[] = [
  {
    key: 'amount',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.expense.amountLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.amountPlaceholder,
    keyboardType: 'decimal-pad',
    hasCurrencyIcon: true,
  },
  {
    key: 'category',
    type: 'categoryGrid',
    label: TRANSACTION_MODAL_TEXT.expense.categoryLabel,
  },
  {
    key: 'description',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.common.descriptionLabel,
    placeholder: TRANSACTION_MODAL_TEXT.expense.descriptionPlaceholder,
    multiline: true,
    numberOfLines: 2,
  },
  {
    key: 'date',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.common.dateLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.datePlaceholder,
  },
];

export const SAVING_FIELD_CONFIGS: TransactionFieldConfig[] = [
  {
    key: 'amount',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.saving.amountLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.amountPlaceholder,
    keyboardType: 'decimal-pad',
    hasCurrencyIcon: true,
  },
  {
    key: 'savingsType',
    type: 'dropdown',
    label: TRANSACTION_MODAL_TEXT.saving.savingsTypeLabel,
    placeholder: TRANSACTION_MODAL_TEXT.saving.savingsTypePlaceholder,
    options: Object.values(SavingsTypeEnum).map((type) => ({
      value: type,
      label: SavingsLabels[type],
    })),
  },
  {
    key: 'description',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.common.descriptionLabel,
    placeholder: TRANSACTION_MODAL_TEXT.saving.descriptionPlaceholder,
    multiline: true,
    numberOfLines: 2,
  },
  {
    key: 'date',
    type: 'input',
    label: TRANSACTION_MODAL_TEXT.common.dateLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.datePlaceholder,
  },
];

export const TRANSACTION_TAB_CONFIGS = {
  [TransactionTab.EXPENSE]: {
    title: TRANSACTION_MODAL_TEXT.expense.title,
    submitLabel: TRANSACTION_MODAL_TEXT.expense.submitLabel,
    fields: EXPENSE_FIELD_CONFIGS,
  },
  [TransactionTab.SAVING]: {
    title: TRANSACTION_MODAL_TEXT.saving.title,
    submitLabel: TRANSACTION_MODAL_TEXT.saving.submitLabel,
    fields: SAVING_FIELD_CONFIGS,
  },
} as const;
