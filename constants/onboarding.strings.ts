export const OnboardingStrings = {
  welcome: {
    title: 'Welcome to BudgetMyBS',
    subtitle: 'Your AI-powered financial companion to help you manage money, crush debts, and reach your goals',
    features: [
      {
        id: 'ai-planning',
        icon: 'sparkles-outline',
        iconFamily: 'ionicons' as const,
        title: 'AI-Powered Planning',
        description: 'Get personalized budget recommendations',
      },
      {
        id: 'track-progress',
        icon: 'trending-up-outline',
        iconFamily: 'ionicons' as const,
        title: 'Track Your Progress',
        description: 'Monitor spending and savings in real-time',
      },
      {
        id: 'achieve-goals',
        icon: 'flag-outline',
        iconFamily: 'ionicons' as const,
        title: 'Achieve Your Goals',
        description: 'Set and reach your financial milestones',
      },
    ],
    getStartedButton: 'Get Started',
    setupTimeHint: 'Takes only 2-3 minutes to set up',
  },

  profile: {
    screenTitle: 'Profile Setup',
    heading: "Let's get to know you",
    subheading: 'Tell us about your financial situation',
    fields: {
      name: {
        label: "What's your name?",
        placeholder: 'Enter your name',
      },
      salary: {
        label: 'Monthly Salary (Net)',
        placeholder: '50000',
        icon: 'cash-outline',
      },
      monthlySavingsTarget: {
        label: 'Monthly Savings Target',
        placeholder: '10000',
        helperText: 'How much do you want to save each month?',
        icon: 'wallet-outline',
      },
      frivolousBudget: {
        label: 'Fun Money Budget',
        placeholder: '5000',
        helperText: 'For entertainment, dining out, etc.',
        icon: 'gift-outline',
      },
    },
    continueButton: 'Continue',
  },

  fixedExpenses: {
    screenTitle: 'Fixed Expenses',
    heading: 'Monthly Fixed Expenses',
    subheading: 'Add your recurring monthly bills',
    addButton: 'Add Fixed Expense',
    skipButton: 'Skip for now',
    continueButton: 'Continue',
    form: {
      name: {
        placeholder: 'Expense name (e.g., Rent)',
      },
      type: {
        placeholder: 'Select category',
      },
      amount: {
        placeholder: 'Amount',
      },
      dayOfMonth: {
        placeholder: 'Day of month (optional)',
        helperText: 'When is this expense due?',
      },
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
    customTypeModal: {
      title: 'Add Custom Category',
      placeholder: 'Enter category name',
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
  },

  debts: {
    screenTitle: 'Debts & Loans',
    heading: 'Your Debts',
    subheading: "Add any loans or debts you're paying off",
    addButton: 'Add Debt',
    skipButton: 'Skip for now',
    continueButton: 'Continue',
    emiLabel: 'Calculated EMI',
    form: {
      name: {
        placeholder: 'Debt name (e.g., Home Loan)',
      },
      type: {
        placeholder: 'Select type',
      },
      principal: {
        label: 'Total Amount',
        placeholder: 'Principal amount',
      },
      interestRate: {
        label: 'Interest Rate',
        placeholder: 'Annual %',
        suffix: '%',
      },
      tenureMonths: {
        label: 'Tenure',
        placeholder: 'Months',
        suffix: 'months',
      },
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
    customTypeModal: {
      title: 'Add Custom Debt Type',
      placeholder: 'Enter debt type',
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
  },

  savings: {
    screenTitle: 'Savings Goals',
    heading: 'Your Savings',
    subheading: 'Add your savings and investment goals',
    addButton: 'Add Savings Goal',
    skipButton: 'Skip for now',
    continueButton: 'Continue',
    form: {
      name: {
        placeholder: 'Goal name (e.g., Emergency Fund)',
      },
      type: {
        placeholder: 'Select type',
      },
      targetAmount: {
        label: 'Monthly Contribution',
        placeholder: 'Target amount per month',
      },
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
    customTypeModal: {
      title: 'Add Custom Savings Type',
      placeholder: 'Enter savings type',
      addButton: 'Add',
      cancelButton: 'Cancel',
    },
  },

  confirmation: {
    screenTitle: 'All Set!',
    title: "You're all set!",
    subtitle: 'Review your financial profile before we save it',
    profileSection: {
      title: 'Profile',
      name: 'Name',
      salary: 'Monthly Salary',
      savingsTarget: 'Savings Target',
      funBudget: 'Fun Money',
    },
    fixedExpensesSection: {
      title: 'Fixed Expenses',
    },
    debtsSection: {
      title: 'Debts & Loans',
    },
    savingsSection: {
      title: 'Savings Goals',
    },
    overviewSection: {
      title: 'Monthly Overview',
      monthlyIncome: 'Monthly Income',
      totalCommitments: 'Total Commitments',
      remaining: 'Available',
    },
    confirmButton: 'Complete Setup',
    backButton: 'Go Back',
    editButton: 'Edit',
  },

  common: {
    currency: '₹',
    backButton: 'Back',
    deleteConfirm: 'Are you sure you want to delete this item?',
    noItems: 'No items added yet',
    perMonth: '/month',
  },

  validation: {
    required: 'This field is required',
    invalidNumber: 'Please enter a valid number',
    positiveNumber: 'Must be a positive number',
    maxLength: (max: number) => `Maximum ${max} characters`,
    minValue: (min: number) => `Must be at least ${min}`,
    maxValue: (max: number) => `Must be at most ${max}`,
    dayOfMonth: 'Day must be between 1 and 31',
    interestRate: 'Interest rate must be between 0 and 100',
  },
} as const;

export type OnboardingStringsType = typeof OnboardingStrings;
