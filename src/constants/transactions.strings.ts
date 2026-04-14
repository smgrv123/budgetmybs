import { ExpenseFilterType, type ExpenseFilterTypeValue } from '@/src/types/expense';

export const TRANSACTION_COMMON_STRINGS = {
  currencySymbol: '₹',
  datePlaceholderISO: 'YYYY-MM-DD',
  amountPlaceholder: '0.00',
  uncategorizedFallback: 'Uncategorized',
  categoryFallback: 'Category',
  noDescriptionFallback: '—',
} as const;

export const TRANSACTION_VALIDATION_STRINGS = {
  startDateISO: 'Start date must be YYYY-MM-DD',
  endDateISO: 'End date must be YYYY-MM-DD',
  dateRange: 'End date must be on or after start date',
  amountRequired: 'Amount is required',
  amountPositive: 'Amount must be a positive number',
  dateValidISO: 'Date must be a valid date (YYYY-MM-DD)',
  dateRequired: 'Date is required',
  categoryRequired: 'Please select a category',
  savingsTypeRequired: 'Please select a savings type',
  amountGreaterThanZero: 'Amount must be greater than 0',
} as const;

export const TRANSACTION_FILTER_TYPE_OPTIONS: readonly { label: string; value: ExpenseFilterTypeValue }[] = [
  { label: 'All', value: ExpenseFilterType.ALL },
  { label: 'Expenses', value: ExpenseFilterType.EXPENSE },
  { label: 'Savings', value: ExpenseFilterType.SAVING },
  { label: 'Impulse', value: ExpenseFilterType.IMPULSE },
] as const;

export const ALL_TRANSACTIONS_STRINGS = {
  screenTitle: 'All Transactions',
  filterModalTitle: 'Filter Transactions',
  filterTypeLabel: 'Type',
  categoryLabel: 'Category',
  categoryPlaceholder: 'All Categories',
  categoryModalTitle: 'Select Category',
  cardLabel: 'Credit Card',
  cardPlaceholder: 'All Cards',
  cardModalTitle: 'Select Card',
  fromLabel: 'From',
  toLabel: 'To',
  clearAllButton: 'Clear All',
  applyButton: 'Apply',
  clearFiltersButton: 'Clear filters',
  retryButton: 'Retry',
  noTransactions: 'No transactions yet',
  noTransactionsFiltered: 'No transactions match your filters',
  loadErrorTitle: 'Failed to load transactions',
  loadErrorBody: 'Something went wrong while fetching your data. Please try again.',
  expensesOnlyChip: 'Expenses only',
  savingsOnlyChip: 'Savings only',
  impulseFilterLabel: 'Impulse Purchases',
  impulseOnlyChip: 'Impulse only',
} as const;

export const TRANSACTION_DETAIL_STRINGS = {
  screenTitle: 'Transaction Details',
  splitwisePaidLabel: 'paid',
  splitwiseShareLabel: 'your share',
  loadingLabel: 'Loading transaction...',
  notFoundLabel: 'Transaction not found',
  recurringReadOnlyBadge: 'Auto-generated · Read-only',
  recurringEditDisabled: "Recurring transactions can't be edited",
  recurringDeleteDisabled: "Recurring transactions can't be deleted",
  amountLabel: 'Amount',
  categoryLabel: 'Category',
  categoryModalTitle: 'Select Category',
  dateLabel: 'Date',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Optional note...',
  impulseBadge: 'Impulse Purchase',
  saveChangesButton: 'Save Changes',
  cancelButton: 'Cancel',
  changesSavedToast: 'Changes saved',
  saveChangesFailedToast: 'Failed to save changes. Please try again.',
  deleteFailedToast: 'Failed to delete transaction. Please try again.',
  deleteAlertTitle: 'Delete Transaction?',
  deleteAlertBody: 'This will permanently remove this transaction. This action cannot be undone.',
  deleteAlertCancel: 'Cancel',
  deleteAlertConfirm: 'Delete',
  creditCardLabel: 'Credit Card',
} as const;

export const ADD_TRANSACTION_STRINGS = {
  createFailedLog: 'Failed to create transaction:',
} as const;

export const TRANSACTION_CARD_STRINGS = {
  billPayBadge: 'Bill Pay',
  cardMask: '••',
  cardSeparator: ' · ',
} as const;
