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

  // Validation errors
  VALIDATION_AMOUNT_REQUIRED: 'Please enter a valid amount greater than 0.',
  VALIDATION_CATEGORY_REQUIRED: 'Please select a category.',
  VALIDATION_INCOME_TYPE_REQUIRED: 'Please select an income type.',
  VALIDATION_CUSTOM_TYPE_REQUIRED: 'Please enter a custom type.',
  VALIDATION_DATE_REQUIRED: 'Please select a date.',
  VALIDATION_ITEM_NOT_FOUND: (name: string) => `Could not find "${name}" to delete.`,
} as const;
