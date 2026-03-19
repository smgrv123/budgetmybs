// AddTransactionModal Constants

export const TRANSACTION_MODAL_TEXT = {
  tabs: {
    expense: 'Expense',
    saving: 'Saving',
  },
  expense: {
    title: 'Add Expense',
    amountLabel: 'How much did you spend?',
    descriptionPlaceholder: 'What did you buy?',
    submitLabel: 'Add Expense',
    categoryLabel: 'Category',
    categoryPlaceholder: 'Select category',
    categoryModalTitle: 'Select Category',
    creditCardLabel: 'Credit Card',
    creditCardPlaceholder: 'Select credit card',
    creditCardModalTitle: 'Select Credit Card',
  },
  saving: {
    title: 'Add Saving',
    amountLabel: 'How much did you save?',
    descriptionPlaceholder: 'What did you save for?',
    submitLabel: 'Add Saving',
    savingsTypeLabel: 'Savings Type',
    savingsTypePlaceholder: 'Select savings type',
    savingsTypeModalTitle: 'Select Savings Type',
  },
  common: {
    amountPlaceholder: '0',
    descriptionLabel: 'Description (Optional)',
    dateLabel: 'Date',
    datePlaceholder: 'DD/MM/YYYY',
    currency: '₹',
  },
} as const;

export enum TransactionTab {
  EXPENSE = 'expense',
  SAVING = 'saving',
}
