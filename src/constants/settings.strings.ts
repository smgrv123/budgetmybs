export const SETTINGS_COMMON_STRINGS = {
  errorAlertTitle: 'Error',
  saveChangesFailed: 'Failed to save changes. Please try again.',
  saveChangesButton: 'Save Changes',
} as const;

export const EDIT_PROFILE_STRINGS = {
  screenTitle: 'Edit Profile',
  saveFailedLog: 'Failed to save profile:',
  saveFailedAlert: 'Failed to save profile. Please try again.',
  saveButton: 'Save Changes',
  heading: 'Update Your Profile',
  subheading: 'Make changes to your profile information',
  deleteAccountButton: 'Delete Account',
  deleteAccountTitle: 'Delete Account?',
  deleteAccountBody: 'This will permanently delete all your data. This action cannot be undone.',
  cancelButton: 'Cancel',
  deleteButton: 'Delete',
  postDeleteRedirect: '/onboarding/welcome',
} as const;

export const DEBTS_SETTINGS_STRINGS = {
  screenTitle: 'Debts & Loans',
  emiLabel: 'EMI',
  secondaryAmountLabel: 'EMI',
  createFailedLog: 'Failed to create debt:',
  updateFailedLog: 'Failed to update debt:',
  removeFailedLog: 'Failed to remove debt:',
} as const;

export const FIXED_EXPENSES_SETTINGS_STRINGS = {
  screenTitle: 'Fixed Expenses',
  createFailedLog: 'Failed to create fixed expense:',
  updateFailedLog: 'Failed to update fixed expense:',
  removeFailedLog: 'Failed to remove fixed expense:',
} as const;

export const SAVINGS_SETTINGS_STRINGS = {
  screenTitle: 'Savings Goals',
  createFailedLog: 'Failed to create savings goal:',
  updateFailedLog: 'Failed to update savings goal:',
  removeFailedLog: 'Failed to remove savings goal:',
} as const;
