/** Chat-related UI string constants */
export const CHAT_STRINGS = {
  HEADER_TITLE: 'FinAI Assistant',
  HEADER_STATUS: '● Online',
  INPUT_PLACEHOLDER: 'Type a message...',
  SEND_BUTTON_ACCESSIBLE: 'Send message',
  CLEAR_HISTORY_ACCESSIBLE: 'Clear chat history',
  NETWORK_ERROR_TITLE: 'No Internet Connection',
  NETWORK_ERROR_BODY: 'Network not available. Please check your connection and try again.',
  NETWORK_ERROR_RETRY: 'Try Again',
  FORM_EXPENSE_TITLE: 'Confirm Expense',
  FORM_EXPENSE_SUBMIT: 'Add Expense',
  FORM_SUBMITTING: 'Adding...',
  FORM_SAVING: 'Saving...',
  FORM_CONFIRM: 'Confirm',
  FORM_CANCEL: 'Cancel',
  DELETE_CONFIRM_SUFFIX: '? This cannot be undone.',
  DELETE_CONFIRM_PREFIX: 'Are you sure you want to delete',
  DELETE_BUTTON: 'Delete',
} as const;

export const CHAT_MESSAGE_STRINGS = {
  fallbackProfileName: 'there',
  welcome: (name: string) =>
    `Hey ${name}! 👋 I'm FinAI, your personal finance assistant. I can help you track expenses, update your financial details, or just answer money questions. What's on your mind?`,
  serviceErrorReply: 'Sorry, I ran into an issue. Please try again in a moment.',
  networkErrorReply: 'Network not available. Please check your connection and try again.',
  expenseSaveFailedReply: "Couldn't save the expense. Please try again.",
  updateSaveFailedReply: "Couldn't save the changes. Please try again.",
  deleteFailedReply: "Couldn't delete. Please try again.",
  updateSuccessReply: '✅ Done! Your data has been updated.',
  expenseAddedReply: (amount: number) => `✅ Expense of ₹${amount.toLocaleString('en-IN')} added successfully!`,
  deleteSuccessReply: (name: string) => `✅ ${name} has been deleted.`,
} as const;

export const CHAT_ALERT_STRINGS = {
  clearHistoryTitle: 'Clear Chat History',
  clearHistoryBody: 'This will permanently delete all messages. This cannot be undone.',
  cancelButton: 'Cancel',
  clearButton: 'Clear',
} as const;

export const CHAT_LOG_STRINGS = {
  chatServiceError: 'Chat service error:',
  networkUnavailable: 'Network unavailable:',
  saveUserMessageError: 'Failed to save user message:',
  saveAssistantMessageError: 'Failed to save assistant message:',
  saveExpenseError: 'Failed to save expense:',
  completeActionError: 'Failed to complete action:',
  updateProfileError: 'Failed to update profile:',
  addFixedExpenseError: 'Failed to add fixed expense:',
  updateFixedExpenseError: 'Failed to update fixed expense:',
  addDebtError: 'Failed to add debt:',
  updateDebtError: 'Failed to update debt:',
  addSavingsGoalError: 'Failed to add savings goal:',
  updateSavingsGoalError: 'Failed to update savings goal:',
  deleteFixedExpenseError: 'Failed to delete fixed expense:',
  deleteDebtError: 'Failed to delete debt:',
  deleteSavingsGoalError: 'Failed to delete savings goal:',
} as const;

export const DeleteEntityType = {
  FIXED_EXPENSE: 'Fixed Expense',
  DEBT: 'Debt',
  SAVINGS_GOAL: 'Savings Goal',
} as const;
export type DeleteEntityTypeValue = (typeof DeleteEntityType)[keyof typeof DeleteEntityType];

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
