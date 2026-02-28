/** Chat-related UI string constants */
export const CHAT_STRINGS = {
  HEADER_TITLE: 'FinAI Assistant',
  HEADER_STATUS: '● Online',
  INPUT_PLACEHOLDER: 'Type a message...',
  SEND_BUTTON_ACCESSIBLE: 'Send message',
  CLEAR_HISTORY_ACCESSIBLE: 'Clear chat history',
  FORM_EXPENSE_TITLE: 'Confirm Expense',
  FORM_EXPENSE_SUBMIT: 'Add Expense',
  FORM_SUBMITTING: 'Adding...',
  FORM_SAVING: 'Saving...',
  FORM_CONFIRM: 'Confirm',
  FORM_CANCEL: 'Cancel',
} as const;

/** Inline update form titles keyed by ChatIntentEnum value */
export const CHAT_FORM_TITLES = {
  update_profile: 'Update Profile',
  add_fixed_expense: 'Add Fixed Expense',
  update_fixed_expense: 'Update Fixed Expense',
  add_debt: 'Add Debt',
  update_debt: 'Update Debt',
  add_savings_goal: 'Add Savings Goal',
  update_savings_goal: 'Update Savings Goal',
} as const;

/** Profile field labels for the inline update form */
export const CHAT_PROFILE_FIELD_LABELS: Record<string, string> = {
  salary: 'Monthly Salary (₹)',
  monthlySavingsTarget: 'Monthly Savings Target (₹)',
  frivolousBudget: 'Discretionary Budget (₹)',
} as const;

// ============================================
// FIELD KEY ENUMS — typed keys for form fields
// ============================================

export const FixedExpenseFieldKey = {
  NAME: 'name',
  AMOUNT: 'amount',
} as const;
export type FixedExpenseFieldKeyType = (typeof FixedExpenseFieldKey)[keyof typeof FixedExpenseFieldKey];

export const DebtFieldKey = {
  NAME: 'name',
  PRINCIPAL: 'principal',
  INTEREST_RATE: 'interestRate',
  EMI_AMOUNT: 'emiAmount',
  TENURE_MONTHS: 'tenureMonths',
} as const;
export type DebtFieldKeyType = (typeof DebtFieldKey)[keyof typeof DebtFieldKey];

export const SavingsGoalFieldKey = {
  NAME: 'name',
  TARGET_AMOUNT: 'targetAmount',
} as const;
export type SavingsGoalFieldKeyType = (typeof SavingsGoalFieldKey)[keyof typeof SavingsGoalFieldKey];

export const ProfileUpdateFieldKey = {
  VALUE: 'value',
} as const;

/** Human-readable labels for each field key */
export const FIELD_KEY_LABELS: Record<string, string> = {
  [FixedExpenseFieldKey.NAME]: 'Name',
  [FixedExpenseFieldKey.AMOUNT]: 'Amount (₹)',
  [DebtFieldKey.PRINCIPAL]: 'Principal (₹)',
  [DebtFieldKey.INTEREST_RATE]: 'Interest Rate (%)',
  [DebtFieldKey.EMI_AMOUNT]: 'Monthly EMI (₹)',
  [DebtFieldKey.TENURE_MONTHS]: 'Tenure (months)',
  [SavingsGoalFieldKey.TARGET_AMOUNT]: 'Target Amount (₹)',
} as const;
