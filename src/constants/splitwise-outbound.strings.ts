/**
 * All user-facing strings for the Splitwise outbound split feature (Phase 5).
 */

export const SplitType = {
  EQUAL: 'equal',
  EXACT: 'exact',
  PERCENTAGE: 'percentage',
  SHARES: 'shares',
} as const;

export const SplitwiseConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECT_REQUIRED: 'reconnect_required',
} as const;

export const SPLITWISE_OUTBOUND_STRINGS = {
  // Toggle
  splitToggleLabel: 'Split with Splitwise',

  // Friend picker (kept for backwards compat with chat flow)
  friendPickerLabel: 'Split with',
  friendPickerPlaceholder: 'Select a friend',
  friendPickerModalTitle: 'Select Friend',

  // Group/friend combined picker
  groupPickerLabel: 'Split with',
  groupPickerPlaceholder: 'Select group or friend',
  groupPickerModalTitle: 'Select Group or Friend',
  groupMemberPickerLabel: 'Split with member',
  groupMemberPickerPlaceholder: 'Select a group member',
  groupMemberPickerModalTitle: 'Select Group Member',
  loadingGroups: 'Loading\u2026',
  noGroupsOrFriendsFound: 'No groups or friends found',

  // Split type
  splitTypeLabel: 'Split type',
  splitTypeEqual: 'Equal',
  splitTypeExact: 'Exact',
  splitTypePercentage: 'Percentage',
  splitTypeShares: 'Shares',

  // Exact split
  yourExactAmountLabel: 'Your amount (₹)',
  yourExactAmountPlaceholder: '0.00',
  friendExactAmountLabel: 'Friend amount (₹)',
  friendExactAmountPlaceholder: '0.00',

  // Percentage split
  yourPercentageLabel: 'Your percentage (%)',
  yourPercentagePlaceholder: '50',
  friendPercentageLabel: 'Friend percentage (%)',
  friendPercentagePlaceholder: '50',

  // Shares split
  yourSharesLabel: 'Your shares',
  yourSharesPlaceholder: '1',
  friendSharesLabel: 'Friend shares',
  friendSharesPlaceholder: '1',

  // Toast messages
  toastOffline: 'Saved locally — will sync with Splitwise when back online',
  toastApiFailed: 'Saved locally — Splitwise sync failed, will retry automatically',

  // Validation
  validationFriendRequired: 'Please select who to split with',
  validationExactAmountsMismatch: 'Exact amounts must add up to the total expense amount',
  validationPercentagesMustSum100: 'Percentages must add up to 100',
  validationSharesMustBePositive: 'Share counts must be positive numbers',
  validationAmountRequired: 'Amount is required',

  // Loading states
  loadingFriends: 'Loading friends…',
  noFriendsFound: 'No friends found on Splitwise',

  // Chat intent
  chatSplitTitle: 'Split Expense with Splitwise',
  chatSplitSubmit: 'Split',
  chatSplitAmountLabel: 'Expense amount (₹)',
  chatSplitAmountPlaceholder: 'e.g. 500',
  chatSplitDescriptionLabel: 'Description',
  chatSplitDescriptionPlaceholder: 'e.g. Dinner',
  chatSplitFriendLabel: 'Friend name',
  chatSplitFriendPlaceholder: 'e.g. Priya',
  chatSplitSuccess: 'Expense split with Splitwise successfully.',
  chatSplitFailure: 'Failed to split expense with Splitwise.',
  chatSplitCancelled: 'Split cancelled.',
} as const;
