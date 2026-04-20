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
} as const;
