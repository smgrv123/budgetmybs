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
  // Toggle (legacy — kept for SplitConfig header label)
  splitToggleLabel: 'Split with Splitwise',

  // Carousel CTAs (Phase 13b)
  addExpenseCta: 'Add Expense',
  splitThisCta: 'Split this →',
  addAndSplitCta: 'Add & Split',
  backToExpense: '← Back',

  // Group/friend combined picker
  groupMemberPickerLabel: 'Split with members',
  groupMemberPickerPlaceholder: 'Select members (default: all)',
  groupMemberPickerModalTitle: 'Select Group Members',
  loadingGroups: 'Loading\u2026',

  // Separate group picker
  groupOnlyPickerLabel: 'Split with group',
  groupOnlyPickerPlaceholder: 'Select a group (optional)',
  groupOnlyPickerModalTitle: 'Select Group',
  groupOnlyPickerClear: 'Clear',
  noGroupsFound: 'No groups found',

  // Friends multi-select
  friendsMultiSelectLabel: 'Split with friends',
  friendsMultiSelectPlaceholder: 'Select friends',
  friendsMultiSelectModalTitle: 'Select Friends',

  // Split type
  splitTypeLabel: 'Split type',
  splitTypeEqual: 'Equal',
  splitTypeExact: 'Exact',
  splitTypePercentage: 'Percentage',
  splitTypeShares: 'Shares',

  // N-person split
  equalSharePreviewLabel: 'Each person owes',
  memberAmountPlaceholder: '0.00',
  memberPercentagePlaceholder: '0',
  memberSharesPlaceholder: '1',
  memberRowYouSuffix: ' (you)',

  // Toast messages
  toastOffline: 'Saved locally — will sync with Splitwise when back online',
  toastApiFailed: 'Saved locally — Splitwise sync failed, will retry automatically',

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
