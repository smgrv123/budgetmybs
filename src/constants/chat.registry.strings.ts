/** Strings for the generic intent registry forms */
export const CHAT_REGISTRY_STRINGS = {
  // Generic form controls
  FORM_CANCEL: 'Cancel',
  FORM_SUBMITTING: 'Saving...',
  FORM_DELETING: 'Deleting...',

  // Delete confirm form
  DELETE_CONFIRM_TITLE: 'Confirm Deletion',
  DELETE_CONFIRM_BODY_PREFIX: 'Are you sure you want to delete',
  DELETE_CONFIRM_BODY_SUFFIX: '? This cannot be undone.',
  DELETE_BUTTON_LABEL: 'Delete',

  // ADD_EXPENSE intent
  ADD_EXPENSE_TITLE: 'Confirm Expense',
  ADD_EXPENSE_AMOUNT_LABEL: 'Amount (₹)',
  ADD_EXPENSE_AMOUNT_PLACEHOLDER: '0',
  ADD_EXPENSE_CATEGORY_LABEL: 'Category',
  ADD_EXPENSE_CATEGORY_MODAL_TITLE: 'Select Category',
  ADD_EXPENSE_CREDIT_CARD_LABEL: 'Credit Card (optional)',
  ADD_EXPENSE_CREDIT_CARD_MODAL_TITLE: 'Select Card',
  ADD_EXPENSE_CREDIT_CARD_PLACEHOLDER: 'None (cash)',
  ADD_EXPENSE_DESCRIPTION_LABEL: 'Description (optional)',
  ADD_EXPENSE_DESCRIPTION_PLACEHOLDER: 'e.g. coffee at Starbucks',
  ADD_EXPENSE_SUBMIT: 'Add Expense',

  // ADD_INCOME intent
  ADD_INCOME_TITLE: 'Confirm Income',
  ADD_INCOME_AMOUNT_LABEL: 'Amount (₹)',
  ADD_INCOME_AMOUNT_PLACEHOLDER: '0',
  ADD_INCOME_TYPE_LABEL: 'Income Type',
  ADD_INCOME_TYPE_MODAL_TITLE: 'Select Income Type',
  ADD_INCOME_CUSTOM_TYPE_LABEL: 'Custom Type',
  ADD_INCOME_CUSTOM_TYPE_PLACEHOLDER: 'e.g. Dividend',
  ADD_INCOME_DESCRIPTION_LABEL: 'Description (optional)',
  ADD_INCOME_DESCRIPTION_PLACEHOLDER: 'e.g. Year-end bonus',
  ADD_INCOME_DATE_LABEL: 'Date',
  ADD_INCOME_SUBMIT: 'Add Income',

  // DELETE_FIXED_EXPENSE intent
  DELETE_FIXED_EXPENSE_TITLE: 'Delete Fixed Expense',
  DELETE_FIXED_EXPENSE_SUBMIT: 'Delete',

  // UPDATE_PROFILE intent
  UPDATE_PROFILE_TITLE: 'Update Profile',
  UPDATE_PROFILE_SUBMIT: 'Update',
  UPDATE_PROFILE_VALUE_PLACEHOLDER: '0',

  // ADD_FIXED_EXPENSE intent
  ADD_FIXED_EXPENSE_TITLE: 'Add Fixed Expense',
  ADD_FIXED_EXPENSE_NAME_LABEL: 'Name',
  ADD_FIXED_EXPENSE_NAME_PLACEHOLDER: 'e.g. Netflix',
  ADD_FIXED_EXPENSE_AMOUNT_LABEL: 'Amount (₹)',
  ADD_FIXED_EXPENSE_AMOUNT_PLACEHOLDER: '0',
  ADD_FIXED_EXPENSE_SUBMIT: 'Add Fixed Expense',

  // UPDATE_FIXED_EXPENSE intent
  UPDATE_FIXED_EXPENSE_TITLE: 'Update Fixed Expense',
  UPDATE_FIXED_EXPENSE_SUBMIT: 'Update',

  // ADD_DEBT intent
  ADD_DEBT_TITLE: 'Add Debt',
  ADD_DEBT_NAME_LABEL: 'Name',
  ADD_DEBT_NAME_PLACEHOLDER: 'e.g. Home Loan',
  ADD_DEBT_PRINCIPAL_LABEL: 'Principal (₹)',
  ADD_DEBT_PRINCIPAL_PLACEHOLDER: '0',
  ADD_DEBT_INTEREST_RATE_LABEL: 'Interest Rate (%)',
  ADD_DEBT_INTEREST_RATE_PLACEHOLDER: '0',
  ADD_DEBT_EMI_LABEL: 'Monthly EMI (₹)',
  ADD_DEBT_EMI_PLACEHOLDER: '0',
  ADD_DEBT_TENURE_LABEL: 'Tenure (months)',
  ADD_DEBT_TENURE_PLACEHOLDER: '0',
  ADD_DEBT_SUBMIT: 'Add Debt',

  // UPDATE_DEBT intent
  UPDATE_DEBT_TITLE: 'Update Debt',
  UPDATE_DEBT_SUBMIT: 'Update',

  // DELETE_DEBT intent
  DELETE_DEBT_TITLE: 'Delete Debt',
  DELETE_DEBT_SUBMIT: 'Delete',

  // ADD_MONTHLY_SAVINGS intent
  ADD_MONTHLY_SAVINGS_TITLE: 'Add Savings Goal',
  ADD_MONTHLY_SAVINGS_NAME_LABEL: 'Name',
  ADD_MONTHLY_SAVINGS_NAME_PLACEHOLDER: 'e.g. Emergency Fund',
  ADD_MONTHLY_SAVINGS_TARGET_LABEL: 'Monthly Target (₹)',
  ADD_MONTHLY_SAVINGS_TARGET_PLACEHOLDER: '0',
  ADD_MONTHLY_SAVINGS_SUBMIT: 'Add Savings Goal',

  // UPDATE_MONTHLY_SAVINGS intent
  UPDATE_MONTHLY_SAVINGS_TITLE: 'Update Savings Goal',
  UPDATE_MONTHLY_SAVINGS_SUBMIT: 'Update',

  // DELETE_MONTHLY_SAVINGS intent
  DELETE_MONTHLY_SAVINGS_TITLE: 'Delete Savings Goal',
  DELETE_MONTHLY_SAVINGS_SUBMIT: 'Delete',

  // LOG_SAVINGS intent
  LOG_SAVINGS_TITLE: 'Log Savings Deposit',
  LOG_SAVINGS_AMOUNT_LABEL: 'Amount (₹)',
  LOG_SAVINGS_AMOUNT_PLACEHOLDER: '0',
  LOG_SAVINGS_DEPOSIT_TO_LABEL: 'Deposit To',
  LOG_SAVINGS_DEPOSIT_TO_MODAL_TITLE: 'Select Destination',
  LOG_SAVINGS_SAVINGS_TYPE_LABEL: 'Savings Category',
  LOG_SAVINGS_SAVINGS_TYPE_MODAL_TITLE: 'Select Category',
  LOG_SAVINGS_DESCRIPTION_LABEL: 'Description (optional)',
  LOG_SAVINGS_DESCRIPTION_PLACEHOLDER: 'e.g. Monthly SIP',
  LOG_SAVINGS_SUBMIT: 'Log Deposit',

  // WITHDRAW_SAVINGS intent
  WITHDRAW_SAVINGS_TITLE: 'Confirm Withdrawal',
  WITHDRAW_SAVINGS_SOURCE_LABEL: 'Withdraw From',
  WITHDRAW_SAVINGS_BALANCE_LABEL: 'Available Balance',
  WITHDRAW_SAVINGS_AMOUNT_LABEL: 'Amount (₹)',
  WITHDRAW_SAVINGS_AMOUNT_PLACEHOLDER: '0',
  WITHDRAW_SAVINGS_REASON_LABEL: 'Reason (optional)',
  WITHDRAW_SAVINGS_REASON_PLACEHOLDER: 'e.g. Medical expense',
  WITHDRAW_SAVINGS_SUBMIT: 'Withdraw',

  // Success / failure messages for migrated intents
  ADD_EXPENSE_SUCCESS: (amount: number) => `Expense of ₹${amount.toLocaleString('en-IN')} added successfully!`,
  ADD_EXPENSE_FAILURE: "Couldn't save the expense. Please try again.",
  ADD_EXPENSE_CANCELLED: 'Expense entry cancelled.',

  ADD_INCOME_SUCCESS: (amount: number) => `Income of ₹${amount.toLocaleString('en-IN')} logged successfully!`,
  ADD_INCOME_FAILURE: "Couldn't save the income entry. Please try again.",
  ADD_INCOME_CANCELLED: 'Income entry cancelled.',

  DELETE_FIXED_EXPENSE_SUCCESS: (name: string) => `${name} has been deleted.`,
  DELETE_FIXED_EXPENSE_FAILURE: "Couldn't delete the fixed expense. Please try again.",
  DELETE_FIXED_EXPENSE_CANCELLED: 'Deletion cancelled.',

  UPDATE_PROFILE_SUCCESS: 'Your profile has been updated successfully.',
  UPDATE_PROFILE_FAILURE: "Couldn't update your profile. Please try again.",
  UPDATE_PROFILE_CANCELLED: 'Profile update cancelled.',

  ADD_FIXED_EXPENSE_SUCCESS: (name: string) => `Fixed expense "${name}" has been added.`,
  ADD_FIXED_EXPENSE_FAILURE: "Couldn't add the fixed expense. Please try again.",
  ADD_FIXED_EXPENSE_CANCELLED: 'Fixed expense entry cancelled.',

  UPDATE_FIXED_EXPENSE_SUCCESS: (name: string) => `Fixed expense "${name}" has been updated.`,
  UPDATE_FIXED_EXPENSE_FAILURE: "Couldn't update the fixed expense. Please try again.",
  UPDATE_FIXED_EXPENSE_CANCELLED: 'Fixed expense update cancelled.',

  ADD_DEBT_SUCCESS: (name: string) => `Debt "${name}" has been added.`,
  ADD_DEBT_FAILURE: "Couldn't add the debt. Please try again.",
  ADD_DEBT_CANCELLED: 'Debt entry cancelled.',

  UPDATE_DEBT_SUCCESS: (name: string) => `Debt "${name}" has been updated.`,
  UPDATE_DEBT_FAILURE: "Couldn't update the debt. Please try again.",
  UPDATE_DEBT_CANCELLED: 'Debt update cancelled.',

  DELETE_DEBT_SUCCESS: (name: string) => `${name} has been deleted.`,
  DELETE_DEBT_FAILURE: "Couldn't delete the debt. Please try again.",
  DELETE_DEBT_CANCELLED: 'Deletion cancelled.',

  ADD_MONTHLY_SAVINGS_SUCCESS: (name: string) => `Savings goal "${name}" has been added.`,
  ADD_MONTHLY_SAVINGS_FAILURE: "Couldn't add the savings goal. Please try again.",
  ADD_MONTHLY_SAVINGS_CANCELLED: 'Savings goal entry cancelled.',

  UPDATE_MONTHLY_SAVINGS_SUCCESS: (name: string) => `Savings goal "${name}" has been updated.`,
  UPDATE_MONTHLY_SAVINGS_FAILURE: "Couldn't update the savings goal. Please try again.",
  UPDATE_MONTHLY_SAVINGS_CANCELLED: 'Savings goal update cancelled.',

  DELETE_MONTHLY_SAVINGS_SUCCESS: (name: string) => `${name} has been deleted.`,
  DELETE_MONTHLY_SAVINGS_FAILURE: "Couldn't delete the savings goal. Please try again.",
  DELETE_MONTHLY_SAVINGS_CANCELLED: 'Deletion cancelled.',

  LOG_SAVINGS_SUCCESS: (amount: number) =>
    `Savings deposit of ₹${amount.toLocaleString('en-IN')} recorded successfully!`,
  LOG_SAVINGS_FAILURE: "Couldn't save the savings deposit. Please try again.",
  LOG_SAVINGS_CANCELLED: 'Savings deposit cancelled.',

  WITHDRAW_SAVINGS_SUCCESS: (amount: number) =>
    `Savings withdrawal of ₹${amount.toLocaleString('en-IN')} processed successfully!`,
  WITHDRAW_SAVINGS_FAILURE: "Couldn't process the withdrawal. Please try again.",
  WITHDRAW_SAVINGS_CANCELLED: 'Withdrawal cancelled.',

  // Validation errors
  VALIDATION_AMOUNT_REQUIRED: 'Please enter a valid amount greater than 0.',
  VALIDATION_CATEGORY_REQUIRED: 'Please select a category.',
  VALIDATION_INCOME_TYPE_REQUIRED: 'Please select an income type.',
  VALIDATION_CUSTOM_TYPE_REQUIRED: 'Please enter a custom type.',
  VALIDATION_DATE_REQUIRED: 'Please select a date.',
  VALIDATION_ITEM_NOT_FOUND: (name: string) => `Could not find "${name}" to delete.`,
  VALIDATION_NAME_REQUIRED: 'Name is required.',
  VALIDATION_PRINCIPAL_REQUIRED: 'Please enter a valid principal amount greater than 0.',
  VALIDATION_INTEREST_RATE_REQUIRED: 'Please enter a valid interest rate greater than 0.',
  VALIDATION_EMI_REQUIRED: 'Please enter a valid EMI amount greater than 0.',
  VALIDATION_TENURE_REQUIRED: 'Please enter a valid tenure greater than 0.',
  VALIDATION_TARGET_REQUIRED: 'Please enter a valid target amount greater than 0.',
  VALIDATION_VALUE_REQUIRED: 'Please enter a valid value greater than 0.',
  VALIDATION_DESTINATION_REQUIRED: 'Please select a destination.',
  VALIDATION_SAVINGS_TYPE_REQUIRED: 'Please select a savings category.',
  VALIDATION_EXCEEDS_BALANCE: 'Amount exceeds available balance.',
} as const;
