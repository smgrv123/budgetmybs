export const SAVINGS_DEPOSIT_STRINGS = {
  // Deposit form
  depositFormTitle: 'Add Savings Deposit',
  amountLabel: 'Amount',
  amountPlaceholder: 'Enter amount',
  savingsTypeLabel: 'Savings Type',
  savingsTypePlaceholder: 'Select type',
  savingsTypeModalTitle: 'Select Savings Type',
  goalLabel: 'Goal (optional)',
  goalPlaceholder: 'Select goal',
  goalModalTitle: 'Select Goal',
  descriptionLabel: 'Description (optional)',
  descriptionPlaceholder: 'e.g. Monthly SIP',
  submitButton: 'Add Deposit',
  adHocGoalOption: 'No goal / Ad-hoc',

  // Summary
  summaryTitle: 'Savings Summary',
  summaryEmptyLabel: 'No deposits recorded yet.',
  summaryTotalLabel: 'Total Saved',
  summaryAdHocSuffix: '(ad-hoc)',

  // Validation
  validation: {
    amountRequired: 'Amount must be greater than 0',
    savingsTypeRequired: 'Please select a savings type',
  },

  // Errors
  createFailedLog: 'Failed to create savings deposit:',
  createFailedAlert: 'Failed to save deposit. Please try again.',

  // Withdrawal form
  withdrawalFormTitle: 'Withdraw Savings',
  withdrawalSourceLabel: 'Withdrawal Source',
  withdrawalSourcePlaceholder: 'Select source',
  withdrawalSourceModalTitle: 'Select Withdrawal Source',
  withdrawalAvailableBalanceLabel: 'Available Balance',
  withdrawalAmountLabel: 'Amount to Withdraw',
  withdrawalAmountPlaceholder: 'Enter amount',
  withdrawalSubmitButton: 'Confirm Withdrawal',
  withdrawalAdHocSuffix: '(ad-hoc)',
  withdrawalButtonLabel: 'Withdraw Savings',

  // Withdrawal validation
  withdrawalValidation: {
    amountRequired: 'Amount must be greater than 0',
    sourceRequired: 'Please select a source',
    amountExceedsBalance: 'Amount cannot exceed the available balance',
  },

  // Withdrawal errors
  withdrawalFailedLog: 'Failed to create savings withdrawal:',
  withdrawalFailedAlert: 'Failed to process withdrawal. Please try again.',
} as const;
