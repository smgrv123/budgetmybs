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

  // UPDATE_EXPENSE intent
  UPDATE_EXPENSE_TITLE: 'Update Expense',
  UPDATE_EXPENSE_ID_LABEL: 'Expense ID',
  UPDATE_EXPENSE_AMOUNT_LABEL: 'New Amount (₹)',
  UPDATE_EXPENSE_AMOUNT_PLACEHOLDER: '0',
  UPDATE_EXPENSE_CATEGORY_LABEL: 'Category',
  UPDATE_EXPENSE_CATEGORY_MODAL_TITLE: 'Select Category',
  UPDATE_EXPENSE_DESCRIPTION_LABEL: 'Description',
  UPDATE_EXPENSE_DESCRIPTION_PLACEHOLDER: 'e.g. coffee at Starbucks',
  UPDATE_EXPENSE_DATE_LABEL: 'Date',
  UPDATE_EXPENSE_SUBMIT: 'Update Expense',

  // DELETE_EXPENSE intent
  DELETE_EXPENSE_TITLE: 'Delete Expense',
  DELETE_EXPENSE_DESCRIPTION_LABEL: 'Description',
  DELETE_EXPENSE_AMOUNT_LABEL: 'Amount',
  DELETE_EXPENSE_SUBMIT: 'Delete',

  // UPDATE_INCOME intent
  UPDATE_INCOME_TITLE: 'Update Income',
  UPDATE_INCOME_ID_LABEL: 'Income ID',
  UPDATE_INCOME_AMOUNT_LABEL: 'New Amount (₹)',
  UPDATE_INCOME_AMOUNT_PLACEHOLDER: '0',
  UPDATE_INCOME_TYPE_LABEL: 'Income Type',
  UPDATE_INCOME_TYPE_MODAL_TITLE: 'Select Income Type',
  UPDATE_INCOME_DESCRIPTION_LABEL: 'Description',
  UPDATE_INCOME_DESCRIPTION_PLACEHOLDER: 'e.g. Year-end bonus',
  UPDATE_INCOME_DATE_LABEL: 'Date',
  UPDATE_INCOME_SUBMIT: 'Update Income',

  // DELETE_INCOME intent
  DELETE_INCOME_TITLE: 'Delete Income',
  DELETE_INCOME_TYPE_LABEL: 'Income Type',
  DELETE_INCOME_AMOUNT_LABEL: 'Amount',
  DELETE_INCOME_SUBMIT: 'Delete',

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

  UPDATE_EXPENSE_SUCCESS: 'Expense updated successfully.',
  UPDATE_EXPENSE_FAILURE: "Couldn't update the expense. Please try again.",
  UPDATE_EXPENSE_CANCELLED: 'Expense update cancelled.',

  DELETE_EXPENSE_SUCCESS: 'Expense deleted successfully.',
  DELETE_EXPENSE_FAILURE: "Couldn't delete the expense. Please try again.",
  DELETE_EXPENSE_CANCELLED: 'Expense deletion cancelled.',

  UPDATE_INCOME_SUCCESS: 'Income entry updated successfully.',
  UPDATE_INCOME_FAILURE: "Couldn't update the income entry. Please try again.",
  UPDATE_INCOME_CANCELLED: 'Income update cancelled.',

  DELETE_INCOME_SUCCESS: 'Income entry deleted successfully.',
  DELETE_INCOME_FAILURE: "Couldn't delete the income entry. Please try again.",
  DELETE_INCOME_CANCELLED: 'Income deletion cancelled.',

  // ADD_CREDIT_CARD intent
  ADD_CREDIT_CARD_TITLE: 'Add Credit Card',
  ADD_CREDIT_CARD_NICKNAME_LABEL: 'Nickname',
  ADD_CREDIT_CARD_NICKNAME_PLACEHOLDER: 'e.g. HDFC Millennia',
  ADD_CREDIT_CARD_BANK_LABEL: 'Bank',
  ADD_CREDIT_CARD_BANK_PLACEHOLDER: 'e.g. HDFC',
  ADD_CREDIT_CARD_PROVIDER_LABEL: 'Provider',
  ADD_CREDIT_CARD_PROVIDER_PLACEHOLDER: 'e.g. Visa',
  ADD_CREDIT_CARD_LAST4_LABEL: 'Last 4 Digits',
  ADD_CREDIT_CARD_LAST4_PLACEHOLDER: '1234',
  ADD_CREDIT_CARD_LIMIT_LABEL: 'Credit Limit (₹)',
  ADD_CREDIT_CARD_LIMIT_PLACEHOLDER: '0',
  ADD_CREDIT_CARD_STATEMENT_DAY_LABEL: 'Statement Day of Month',
  ADD_CREDIT_CARD_STATEMENT_DAY_PLACEHOLDER: 'e.g. 15',
  ADD_CREDIT_CARD_BUFFER_DAYS_LABEL: 'Payment Buffer Days',
  ADD_CREDIT_CARD_BUFFER_DAYS_PLACEHOLDER: 'e.g. 5',
  ADD_CREDIT_CARD_SUBMIT: 'Add Credit Card',

  // UPDATE_CREDIT_CARD intent
  UPDATE_CREDIT_CARD_TITLE: 'Update Credit Card',
  UPDATE_CREDIT_CARD_SUBMIT: 'Update',

  // DELETE_CREDIT_CARD intent
  DELETE_CREDIT_CARD_TITLE: 'Delete Credit Card',
  DELETE_CREDIT_CARD_SUBMIT: 'Delete',

  // LOG_IMPULSE_DIRECT intent
  LOG_IMPULSE_DIRECT_TITLE: 'Confirm Impulse Purchase',
  LOG_IMPULSE_DIRECT_AMOUNT_LABEL: 'Amount (₹)',
  LOG_IMPULSE_DIRECT_AMOUNT_PLACEHOLDER: '0',
  LOG_IMPULSE_DIRECT_CATEGORY_LABEL: 'Category',
  LOG_IMPULSE_DIRECT_CATEGORY_MODAL_TITLE: 'Select Category',
  LOG_IMPULSE_DIRECT_CREDIT_CARD_LABEL: 'Credit Card (optional)',
  LOG_IMPULSE_DIRECT_CREDIT_CARD_MODAL_TITLE: 'Select Card',
  LOG_IMPULSE_DIRECT_CREDIT_CARD_PLACEHOLDER: 'None (cash)',
  LOG_IMPULSE_DIRECT_DESCRIPTION_LABEL: 'Description (optional)',
  LOG_IMPULSE_DIRECT_DESCRIPTION_PLACEHOLDER: 'e.g. shoes at Zara',
  LOG_IMPULSE_DIRECT_SUBMIT: 'Log Impulse Purchase',

  // Credit card success/failure/cancelled messages
  ADD_CREDIT_CARD_SUCCESS: (nickname: string) => `Credit card "${nickname}" has been added.`,
  ADD_CREDIT_CARD_FAILURE: "Couldn't add the credit card. Please try again.",
  ADD_CREDIT_CARD_CANCELLED: 'Credit card entry cancelled.',

  UPDATE_CREDIT_CARD_SUCCESS: (nickname: string) => `Credit card "${nickname}" has been updated.`,
  UPDATE_CREDIT_CARD_FAILURE: "Couldn't update the credit card. Please try again.",
  UPDATE_CREDIT_CARD_CANCELLED: 'Credit card update cancelled.',

  DELETE_CREDIT_CARD_SUCCESS: (nickname: string) => `${nickname} has been deleted.`,
  DELETE_CREDIT_CARD_FAILURE: "Couldn't delete the credit card. Please try again.",
  DELETE_CREDIT_CARD_CANCELLED: 'Deletion cancelled.',

  LOG_IMPULSE_DIRECT_SUCCESS: (amount: number) =>
    `Impulse purchase of ₹${amount.toLocaleString('en-IN')} logged successfully!`,
  LOG_IMPULSE_DIRECT_FAILURE: "Couldn't save the impulse purchase. Please try again.",
  LOG_IMPULSE_DIRECT_CANCELLED: 'Impulse purchase entry cancelled.',

  // LOG_IMPULSE_COOLDOWN intent
  LOG_IMPULSE_COOLDOWN_TITLE: 'Impulse Buy Cooldown',
  LOG_IMPULSE_COOLDOWN_AMOUNT_LABEL: 'Amount (₹)',
  LOG_IMPULSE_COOLDOWN_AMOUNT_PLACEHOLDER: '0',
  LOG_IMPULSE_COOLDOWN_CATEGORY_LABEL: 'Category',
  LOG_IMPULSE_COOLDOWN_CATEGORY_MODAL_TITLE: 'Select Category',
  LOG_IMPULSE_COOLDOWN_CREDIT_CARD_LABEL: 'Credit Card (optional)',
  LOG_IMPULSE_COOLDOWN_CREDIT_CARD_MODAL_TITLE: 'Select Card',
  LOG_IMPULSE_COOLDOWN_CREDIT_CARD_PLACEHOLDER: 'None (cash)',
  LOG_IMPULSE_COOLDOWN_DESCRIPTION_LABEL: 'Description (optional)',
  LOG_IMPULSE_COOLDOWN_DESCRIPTION_PLACEHOLDER: 'e.g. sneakers at Nike',
  LOG_IMPULSE_COOLDOWN_MINUTES_LABEL: 'Cooldown Duration (minutes)',
  LOG_IMPULSE_COOLDOWN_MINUTES_PLACEHOLDER: 'e.g. 120',
  LOG_IMPULSE_COOLDOWN_SUBMIT: 'Start Cooldown',
  LOG_IMPULSE_COOLDOWN_SUCCESS: (amount: number) =>
    `Cooldown started for ₹${amount.toLocaleString('en-IN')} impulse purchase. You'll get a reminder when it expires.`,
  LOG_IMPULSE_COOLDOWN_SUCCESS_NO_PERMISSION: (amount: number) =>
    `Notifications are off — impulse purchase of ₹${amount.toLocaleString('en-IN')} logged directly.`,
  LOG_IMPULSE_COOLDOWN_FAILURE: "Couldn't start the cooldown. Please try again.",
  LOG_IMPULSE_COOLDOWN_CANCELLED: 'Impulse cooldown cancelled.',
  VALIDATION_COOLDOWN_MINUTES_REQUIRED: 'Please enter a cooldown duration greater than 0.',

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
  VALIDATION_NICKNAME_REQUIRED: 'Nickname is required.',
  VALIDATION_BANK_REQUIRED: 'Bank name is required.',
  VALIDATION_PROVIDER_REQUIRED: 'Provider is required.',
  VALIDATION_LAST4_REQUIRED: 'Please enter a valid 4-digit card number.',
  VALIDATION_CREDIT_LIMIT_INVALID: 'Credit limit must be greater than 0.',
  VALIDATION_STATEMENT_DAY_INVALID: 'Statement day must be between 1 and 31.',
  VALIDATION_BUFFER_DAYS_INVALID: 'Payment buffer days must be 0 or greater.',
  VALIDATION_AT_LEAST_ONE_FIELD: 'Please update at least one field.',
} as const;

// ============================================
// ROTATING MESSAGE POOLS — single-message pattern
// ============================================

export type IntentCategory =
  | 'expense'
  | 'income'
  | 'savings'
  | 'debt'
  | 'fixed_expense'
  | 'profile'
  | 'credit_card'
  | 'general';

export const INTENT_CATEGORY_MAP: Record<string, IntentCategory> = {
  add_expense: 'expense',
  update_expense: 'expense',
  delete_expense: 'expense',
  add_income: 'income',
  update_income: 'income',
  delete_income: 'income',
  log_savings: 'savings',
  withdraw_savings: 'savings',
  add_monthly_savings: 'savings',
  update_monthly_savings: 'savings',
  delete_monthly_savings: 'savings',
  add_debt: 'debt',
  update_debt: 'debt',
  delete_debt: 'debt',
  add_fixed_expense: 'fixed_expense',
  update_fixed_expense: 'fixed_expense',
  delete_fixed_expense: 'fixed_expense',
  update_profile: 'profile',
  add_credit_card: 'credit_card',
  update_credit_card: 'credit_card',
  delete_credit_card: 'credit_card',
  log_impulse_direct: 'expense',
  log_impulse_cooldown: 'expense',
  connect_splitwise: 'general',
  disconnect_splitwise: 'general',
  general: 'general',
};

export const CHAT_ACTION_MESSAGE_POOLS: Record<
  IntentCategory,
  { success: string[]; failure: string[]; cancel: string[] }
> = {
  expense: {
    success: [
      'Got it — expense logged.',
      'Noted. Your spending is up to date.',
      'Expense added.',
      'Done. That expense is in.',
      'Logged.',
      'All set, expense saved.',
      'Added to your expenses.',
      'Expense recorded.',
      'Saved.',
      'Budget updated.',
    ],
    failure: [
      "Couldn't save that expense. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to log the expense. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — nothing logged.',
    ],
  },
  income: {
    success: [
      'Income logged.',
      'Got it — income recorded.',
      'Added to your income.',
      'Nice one. Income saved.',
      'Income updated.',
      'Earnings logged.',
      'Done. Income is in.',
      'Saved your income entry.',
      'Logged.',
      'Income recorded.',
    ],
    failure: [
      "Couldn't save that income entry. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to log income. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — nothing logged.',
    ],
  },
  savings: {
    success: [
      'Savings updated.',
      'Done — savings logged.',
      'Got it, savings recorded.',
      'Savings up to date.',
      'Added to your savings.',
      'Saved.',
      'Your savings are in.',
      'Savings logged.',
      'Done.',
      'Savings entry recorded.',
    ],
    failure: [
      "Couldn't update savings. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to save that. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — nothing logged.',
    ],
  },
  debt: {
    success: [
      'Debt updated.',
      'Got it — debt recorded.',
      'Done. Your debt entries are updated.',
      'Debt log updated.',
      'Saved.',
      'Debt entry recorded.',
      'Logged.',
      'Your debt is up to date.',
      'Done — debt saved.',
      'Debt updated.',
    ],
    failure: [
      "Couldn't update debt. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to save that. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — nothing logged.',
    ],
  },
  fixed_expense: {
    success: [
      'Fixed expense updated.',
      'Done — recurring expense saved.',
      'Got it. Fixed expense recorded.',
      'Saved your fixed expense.',
      'Fixed expense logged.',
      'Recurring entry updated.',
      'Done.',
      'Fixed expense is up to date.',
      'Logged.',
      'Recurring expense saved.',
    ],
    failure: [
      "Couldn't update that fixed expense. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to save that. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — nothing changed.',
    ],
  },
  profile: {
    success: [
      'Profile updated.',
      'Got it — profile saved.',
      'Done. Your profile is current.',
      'Saved.',
      'Profile is up to date.',
      'Updated your profile.',
      'Done — profile saved.',
      'Got it.',
      'Your details are updated.',
      'Profile saved.',
    ],
    failure: [
      "Couldn't update your profile. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to save that. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was changed.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — profile unchanged.',
    ],
  },
  credit_card: {
    success: [
      'Credit card updated.',
      'Got it — card saved.',
      'Done. Your card details are up to date.',
      'Card saved.',
      'Credit card recorded.',
      'Done — card updated.',
      'Card entry saved.',
      'Saved.',
      'Your card is up to date.',
      'Credit card details saved.',
      'Done.',
    ],
    failure: [
      "Couldn't update the credit card. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed to save the card. Try again.',
      'No luck there — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was changed.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it — card unchanged.',
    ],
  },
  general: {
    success: [
      'Done.',
      'Got it.',
      'Noted.',
      'Saved.',
      'All set.',
      'Logged.',
      'All good.',
      'Done — records updated.',
      'Saved that.',
      'Recorded.',
    ],
    failure: [
      "Couldn't complete that. Try again.",
      'Something went wrong. Give it another shot.',
      "Hmm, that didn't go through. Try once more.",
      'Failed. Try again.',
      'No luck — try again.',
    ],
    cancel: [
      'No worries, skipped.',
      'OK, nothing was saved.',
      'Cancelled.',
      'Sure, cancelled.',
      'No problem.',
      'Got it.',
    ],
  },
};

export const pickMessage = (pool: string[]): string => pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? '';
