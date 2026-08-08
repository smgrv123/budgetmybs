/**
 * All user-facing strings for the Splitwise Balances feature (Phase 4).
 */

export const SPLITWISE_BALANCES_STRINGS = {
  // Dashboard card
  cardTitle: 'Splitwise Balances',
  youAreOwedLabel: 'You are owed',
  youOweLabel: 'You owe',

  // Friends list screen
  screenTitle: 'Splitwise Balances',
  friendsListEmpty: 'No outstanding balances',
  friendsListEmptySubtitle: 'All settled up!',
  owedByLabel: 'owes you',
  youOweThemLabel: 'you owe',

  // Progress bar
  inTransitLabel: 'In transit',

  // Chat
  checkBalancesTitle: 'Check Balances',
  checkBalancesButton: 'Got it',
  checkBalancesEmpty: 'You have no outstanding Splitwise balances.',
  checkBalancesOwed: (amount: string) => `You are owed ${amount} in total.`,
  checkBalancesOwe: (amount: string) => `You owe ${amount} in total.`,
  checkBalancesPerFriend: (userId: string, amount: string, direction: 'owed' | 'owe') =>
    direction === 'owed' ? `User ${userId} owes you ${amount}.` : `You owe User ${userId} ${amount}.`,

  // Settlement buttons (Phase 8)
  settleUpButton: 'Settle up',
  markReceivedButton: 'Mark as received',

  // IRL warning dialog
  irlWarningTitle: 'Did you transfer the money?',
  irlWarningSettleBody: (friendName: string, amount: string) =>
    `Make sure you've actually paid ${friendName} ${amount}. This is ledger-only — Splitwise will record the settlement, but no real money moves.`,
  irlWarningReceiveBody: (friendName: string, amount: string) =>
    `Make sure ${friendName} has actually paid you ${amount}. This is ledger-only — Splitwise will record the settlement, but no real money moves.`,
  irlWarningCancel: 'Cancel',
  irlWarningConfirmSettle: 'Confirm settlement',
  irlWarningConfirmReceive: 'Confirm receipt',

  // Toasts
  settleSuccessToast: 'Settlement recorded',
  settleFailureToast: 'Splitwise sync failed — will retry automatically',
  settleOfflineToast: "You're offline — this will sync with Splitwise when back online",

  // Settlement income description prefix (used when creating the local additional_income row)
  settlementSentIncomePrefix: 'Splitwise settlement to',

  // Chat intent (settle_splitwise)
  chatSettleTitle: 'Settle up with Splitwise',
  chatSettleSubmit: 'Settle',
  chatSettleAmountLabel: 'Amount (₹)',
  chatSettleAmountPlaceholder: 'e.g. 500',
  chatSettleFriendLabel: 'Friend name',
  chatSettleFriendPlaceholder: 'e.g. Rohan',
  chatSettleSuccess: 'Settlement recorded with Splitwise.',
  chatSettleFailure: 'Failed to record settlement with Splitwise.',
  chatSettleCancelled: 'Settlement cancelled.',
  chatSettleFriendNotFound: (name: string) => `Could not find a Splitwise friend named "${name}".`,
} as const;
