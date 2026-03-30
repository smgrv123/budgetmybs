export const SAVINGS_SCREEN_STRINGS = {
  screenTitle: 'Monthly Savings',
  headerSubtitle: 'Total Savings (All Time)',

  tabs: {
    overview: 'Overview',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
  },

  overview: {
    noGoals: 'No savings goals yet. Add goals in Settings.',
    ofTarget: 'of',
    percentComplete: '% complete',
    monthlyTargetMet: 'Monthly target met',
    adHocSectionTitle: 'Ad-hoc Savings',
    adHocSectionIcon: 'wallet-outline',
    allTimeTotalLabel: 'All-time total',
  },

  deposit: {
    title: 'Deposit to Savings',
    subtitle: 'Add money to your savings',
    depositToLabel: 'Deposit To',
    depositToPlaceholder: 'Select goal or ad-hoc',
    depositToModalTitle: 'Select Destination',
    adHocOption: 'Ad-hoc',
    categoryLabel: 'Savings Category',
    categoryPlaceholder: 'Select category',
    categoryModalTitle: 'Select Category',
    amountLabel: 'Amount',
    amountPlaceholder: '0.00',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'e.g. Monthly SIP',
    confirmButton: 'Confirm Deposit',
    createFailedLog: 'Failed to create savings deposit:',
    createFailedAlert: 'Failed to save deposit. Please try again.',
    validation: {
      amountRequired: 'Amount must be greater than 0',
      categoryRequired: 'Please select a savings category',
      destinationRequired: 'Please select a destination',
    },
  },

  withdraw: {
    title: 'Withdraw from Savings',
    subtitle: 'This will top up your monthly budget',
    sourceLabel: 'Withdraw From',
    sourcePlaceholder: 'Select source',
    sourceModalTitle: 'Select Source',
    availableBalanceLabel: 'Available Balance',
    amountLabel: 'Amount',
    amountPlaceholder: '0.00',
    reasonLabel: 'Reason for Withdrawal',
    reasonPlaceholder: 'Why are you withdrawing?',
    warningBanner: 'Withdrawing savings will increase your monthly spending budget. Use this carefully.',
    confirmButton: 'Confirm Withdrawal',
    adHocSuffix: '(ad-hoc)',
    withdrawalDescription: 'Savings Withdrawal',
    withdrawalFailedLog: 'Failed to create savings withdrawal:',
    withdrawalFailedAlert: 'Failed to process withdrawal. Please try again.',
    validation: {
      amountRequired: 'Amount must be greater than 0',
      sourceRequired: 'Please select a source',
      amountExceedsBalance: 'Amount cannot exceed the available balance',
    },
  },

  checklist: {
    sectionTitle: 'Monthly Savings',
    noGoalsLabel: 'No savings goals yet. Add goals in Settings.',
    seeAll: 'See All',
  },
} as const;
