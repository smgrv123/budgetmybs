import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/src/constants/transactionModal';
import { SavingsLabels, SavingsTypeEnum } from '@/db/types';
import {
  TransactionFieldKey,
  TransactionFieldType,
  TransactionKeyboardType,
  type TransactionFieldConfig,
} from '@/src/types/transaction';

export const EXPENSE_FIELD_CONFIGS: TransactionFieldConfig[] = [
  {
    key: TransactionFieldKey.AMOUNT,
    type: TransactionFieldType.INPUT,
    label: TRANSACTION_MODAL_TEXT.expense.amountLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.amountPlaceholder,
    keyboardType: TransactionKeyboardType.DECIMAL_PAD,
    hasCurrencyIcon: true,
  },
  {
    key: TransactionFieldKey.CATEGORY,
    type: TransactionFieldType.DROPDOWN,
    label: TRANSACTION_MODAL_TEXT.expense.categoryLabel,
    placeholder: TRANSACTION_MODAL_TEXT.expense.categoryPlaceholder,
  },
  {
    key: TransactionFieldKey.DESCRIPTION,
    type: TransactionFieldType.INPUT,
    label: TRANSACTION_MODAL_TEXT.common.descriptionLabel,
    placeholder: TRANSACTION_MODAL_TEXT.expense.descriptionPlaceholder,
    multiline: true,
    numberOfLines: 2,
  },
  {
    key: TransactionFieldKey.DATE,
    type: TransactionFieldType.INPUT,
    label: TRANSACTION_MODAL_TEXT.common.dateLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.datePlaceholder,
  },
];

export const SAVING_FIELD_CONFIGS: TransactionFieldConfig[] = [
  {
    key: TransactionFieldKey.AMOUNT,
    type: TransactionFieldType.INPUT,
    label: TRANSACTION_MODAL_TEXT.saving.amountLabel,
    placeholder: TRANSACTION_MODAL_TEXT.common.amountPlaceholder,
    keyboardType: TransactionKeyboardType.DECIMAL_PAD,
    hasCurrencyIcon: true,
  },
  {
    key: TransactionFieldKey.SAVINGS_TYPE,
    type: TransactionFieldType.DROPDOWN,
    label: TRANSACTION_MODAL_TEXT.saving.savingsTypeLabel,
    placeholder: TRANSACTION_MODAL_TEXT.saving.savingsTypePlaceholder,
    options: Object.values(SavingsTypeEnum).map((type) => ({
      value: type,
      label: SavingsLabels[type],
    })),
  },
  {
    key: TransactionFieldKey.DESCRIPTION,
    type: TransactionFieldType.INPUT,
    label: TRANSACTION_MODAL_TEXT.common.descriptionLabel,
    placeholder: TRANSACTION_MODAL_TEXT.saving.descriptionPlaceholder,
    multiline: true,
    numberOfLines: 2,
  },
  {
    key: TransactionFieldKey.DATE,
    type: TransactionFieldType.INPUT,
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
