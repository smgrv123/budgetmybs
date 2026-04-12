/**
 * Type definitions and enums for the budgeting app database
 */

// ============================================
// ENUMS
// ============================================

/**
 * Fixed expense types - predictable monthly outflows
 */
export const FixedExpenseTypeEnum = {
  RENT: 'rent',
  UTILITIES: 'utilities',
  INTERNET: 'internet',
  PHONE: 'phone',
  INSURANCE: 'insurance',
  SUBSCRIPTIONS: 'subscriptions',
  EMI: 'emi',
  GROCERIES: 'groceries',
  TRANSPORT: 'transport',
  DOMESTIC_HELP: 'domestic_help',
  OTHER: 'other',
} as const;

export type FixedExpenseType = (typeof FixedExpenseTypeEnum)[keyof typeof FixedExpenseTypeEnum];

export const FIXED_EXPENSE_TYPES = Object.values(FixedExpenseTypeEnum);

/**
 * Debt types
 */
export const DebtTypeEnum = {
  HOME_LOAN: 'home_loan',
  CAR_LOAN: 'car_loan',
  PERSONAL_LOAN: 'personal_loan',
  EDUCATION_LOAN: 'education_loan',
  CREDIT_CARD: 'credit_card',
  GOLD_LOAN: 'gold_loan',
  BUSINESS_LOAN: 'business_loan',
  OTHER: 'other',
} as const;

export type DebtType = (typeof DebtTypeEnum)[keyof typeof DebtTypeEnum];

export const DEBT_TYPES = Object.values(DebtTypeEnum);

/**
 * Debt payoff preference strategies
 */
export const DebtPayoffPreferenceEnum = {
  AVALANCHE: 'avalanche', // Highest interest rate first - saves most money
  SNOWBALL: 'snowball', // Smallest balance first - psychological wins
} as const;

export type DebtPayoffPreference = (typeof DebtPayoffPreferenceEnum)[keyof typeof DebtPayoffPreferenceEnum];

export const DEBT_PAYOFF_PREFERENCES = Object.values(DebtPayoffPreferenceEnum);

/**
 * Category types for variable expenses
 */
export const CategoryTypeEnum = {
  FOOD: 'food',
  SHOPPING: 'shopping',
  ENTERTAINMENT: 'entertainment',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  PERSONAL_CARE: 'personal_care',
  GIFTS: 'gifts',
  TRAVEL: 'travel',
  FITNESS: 'fitness',
  BILLS: 'bills',
  OTHER: 'other',
} as const;

export type CategoryType = (typeof CategoryTypeEnum)[keyof typeof CategoryTypeEnum];

export const CATEGORY_TYPES = Object.values(CategoryTypeEnum);

/**
 * Savings goal types
 */
export const SavingsTypeEnum = {
  FD: 'fd',
  RD: 'rd',
  MUTUAL_FUNDS: 'mutual_funds',
  STOCKS: 'stocks',
  PPF: 'ppf',
  NPS: 'nps',
  GOLD: 'gold',
  CRYPTO: 'crypto',
  EMERGENCY_FUND: 'emergency_fund',
  OTHER: 'other',
} as const;

export type SavingsType = (typeof SavingsTypeEnum)[keyof typeof SavingsTypeEnum];

export const SAVINGS_TYPES = Object.values(SavingsTypeEnum);

/**
 * Recurring expense source types
 */
export const RecurringSourceTypeEnum = {
  FIXED_EXPENSE: 'fixed_expense',
  DEBT_EMI: 'debt_emi',
} as const;

export type RecurringSourceType = (typeof RecurringSourceTypeEnum)[keyof typeof RecurringSourceTypeEnum];

export const RECURRING_SOURCE_TYPES = Object.values(RecurringSourceTypeEnum);

/**
 * Credit card provider types
 */
export const CreditCardProviderEnum = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  RUPAY: 'rupay',
  DINERS: 'diners',
  DISCOVER: 'discover',
  OTHER: 'other',
} as const;

export type CreditCardProvider = (typeof CreditCardProviderEnum)[keyof typeof CreditCardProviderEnum];

export const CREDIT_CARD_PROVIDERS = Object.values(CreditCardProviderEnum);

/**
 * Credit card transaction types
 */
export const CreditCardTxnTypeEnum = {
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
} as const;

export type CreditCardTxnType = (typeof CreditCardTxnTypeEnum)[keyof typeof CreditCardTxnTypeEnum];

export const CREDIT_CARD_TXN_TYPES = Object.values(CreditCardTxnTypeEnum);

/**
 * Income types
 */
export const IncomeTypeEnum = {
  BONUS: 'bonus',
  INTEREST: 'interest',
  CASHBACK: 'cashback',
  GIFT: 'gift',
  FREELANCE: 'freelance',
  REFUND: 'refund',
  SAVINGS_WITHDRAWAL: 'savings_withdrawal',
  SPLITWISE_SETTLEMENT: 'splitwise_settlement',
  OTHER: 'other',
} as const;

export type IncomeType = (typeof IncomeTypeEnum)[keyof typeof IncomeTypeEnum];

export const INCOME_TYPES = Object.values(IncomeTypeEnum);

/**
 * Income types available for user-facing dropdowns (excludes system-only types).
 * `savings_withdrawal` and `splitwise_settlement` are system-generated and must not
 * appear in income entry forms or chat intent pickers.
 */
export const USER_INCOME_TYPES = INCOME_TYPES.filter(
  (t) => t !== IncomeTypeEnum.SAVINGS_WITHDRAWAL && t !== IncomeTypeEnum.SPLITWISE_SETTLEMENT
);

/**
 * Splitwise sync status for outbound push tracking
 */
export const SplitwiseSyncStatusEnum = {
  SYNCED: 'synced',
  PENDING_PUSH: 'pending_push',
  PUSH_FAILED: 'push_failed',
} as const;

export type SplitwiseSyncStatus = (typeof SplitwiseSyncStatusEnum)[keyof typeof SplitwiseSyncStatusEnum];

export const SPLITWISE_SYNC_STATUSES = Object.values(SplitwiseSyncStatusEnum);

// ============================================
// DISPLAY LABELS (for UI)
// ============================================

export const FixedExpenseLabels: Record<FixedExpenseType, string> = {
  rent: 'Rent',
  utilities: 'Utilities',
  internet: 'Internet',
  phone: 'Phone',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  emi: 'EMI',
  groceries: 'Groceries',
  transport: 'Transport',
  domestic_help: 'Domestic Help',
  other: 'Other',
};

export const DebtLabels: Record<DebtType, string> = {
  home_loan: 'Home Loan',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  education_loan: 'Education Loan',
  credit_card: 'Credit Card',
  gold_loan: 'Gold Loan',
  business_loan: 'Business Loan',
  other: 'Other',
};

export const CategoryLabels: Record<CategoryType, string> = {
  food: 'Food & Dining',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  education: 'Education',
  personal_care: 'Personal Care',
  gifts: 'Gifts',
  travel: 'Travel',
  fitness: 'Fitness',
  bills: 'Bills',
  other: 'Other',
};

export const SavingsLabels: Record<SavingsType, string> = {
  fd: 'Fixed Deposit',
  rd: 'Recurring Deposit',
  mutual_funds: 'Mutual Funds',
  stocks: 'Stocks',
  ppf: 'PPF',
  nps: 'NPS',
  gold: 'Gold',
  crypto: 'Crypto',
  emergency_fund: 'Emergency Fund',
  other: 'Other',
};

/**
 * Display labels for all income types.
 * Use USER_INCOME_TYPES to filter out system-only types (e.g. savings_withdrawal,
 * splitwise_settlement) in dropdowns.
 */
export const IncomeLabels: Record<IncomeType, string> = {
  bonus: 'Bonus',
  interest: 'Interest',
  cashback: 'Cashback',
  gift: 'Gift',
  freelance: 'Freelance',
  refund: 'Refund',
  savings_withdrawal: 'Savings Withdrawal',
  splitwise_settlement: 'Splitwise Settlement',
  other: 'Other',
};

// ============================================
// CHAT TYPES
// ============================================

export const ChatRoleEnum = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;
export type ChatRole = (typeof ChatRoleEnum)[keyof typeof ChatRoleEnum];
export const CHAT_ROLES = Object.values(ChatRoleEnum);

export const ChatActionTypeEnum = {
  ADD_EXPENSE: 'add_expense',
  UPDATE_PROFILE: 'update_profile',
  ADD_FIXED_EXPENSE: 'add_fixed_expense',
  UPDATE_FIXED_EXPENSE: 'update_fixed_expense',
  DELETE_FIXED_EXPENSE: 'delete_fixed_expense',
  ADD_DEBT: 'add_debt',
  UPDATE_DEBT: 'update_debt',
  DELETE_DEBT: 'delete_debt',
  ADD_MONTHLY_SAVINGS: 'add_monthly_savings',
  UPDATE_MONTHLY_SAVINGS: 'update_monthly_savings',
  DELETE_MONTHLY_SAVINGS: 'delete_monthly_savings',
  ADD_INCOME: 'add_income',
  LOG_SAVINGS: 'log_savings',
  WITHDRAW_SAVINGS: 'withdraw_savings',
  UPDATE_EXPENSE: 'update_expense',
  DELETE_EXPENSE: 'delete_expense',
  UPDATE_INCOME: 'update_income',
  DELETE_INCOME: 'delete_income',
  ADD_CREDIT_CARD: 'add_credit_card',
  UPDATE_CREDIT_CARD: 'update_credit_card',
  DELETE_CREDIT_CARD: 'delete_credit_card',
  LOG_IMPULSE_DIRECT: 'log_impulse_direct',
  LOG_IMPULSE_COOLDOWN: 'log_impulse_cooldown',
  CONNECT_SPLITWISE: 'connect_splitwise',
  DISCONNECT_SPLITWISE: 'disconnect_splitwise',
  SYNC_SPLITWISE: 'sync_splitwise',
} as const;
export type ChatActionType = (typeof ChatActionTypeEnum)[keyof typeof ChatActionTypeEnum];
export const CHAT_ACTION_TYPES = Object.values(ChatActionTypeEnum);

export const ChatActionStatusEnum = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type ChatActionStatus = (typeof ChatActionStatusEnum)[keyof typeof ChatActionStatusEnum];
export const CHAT_ACTION_STATUSES = Object.values(ChatActionStatusEnum);

export const ProfileFieldEnum = {
  SALARY: 'salary',
  MONTHLY_SAVINGS_TARGET: 'monthlySavingsTarget',
  FRIVOLOUS_BUDGET: 'frivolousBudget',
} as const;
export type ProfileFieldType = (typeof ProfileFieldEnum)[keyof typeof ProfileFieldEnum];

export const ChatIntentEnum = {
  ADD_EXPENSE: 'add_expense',
  UPDATE_PROFILE: 'update_profile',
  ADD_FIXED_EXPENSE: 'add_fixed_expense',
  UPDATE_FIXED_EXPENSE: 'update_fixed_expense',
  DELETE_FIXED_EXPENSE: 'delete_fixed_expense',
  ADD_DEBT: 'add_debt',
  UPDATE_DEBT: 'update_debt',
  DELETE_DEBT: 'delete_debt',
  ADD_MONTHLY_SAVINGS: 'add_monthly_savings',
  UPDATE_MONTHLY_SAVINGS: 'update_monthly_savings',
  DELETE_MONTHLY_SAVINGS: 'delete_monthly_savings',
  ADD_INCOME: 'add_income',
  LOG_SAVINGS: 'log_savings',
  WITHDRAW_SAVINGS: 'withdraw_savings',
  UPDATE_EXPENSE: 'update_expense',
  DELETE_EXPENSE: 'delete_expense',
  UPDATE_INCOME: 'update_income',
  DELETE_INCOME: 'delete_income',
  ADD_CREDIT_CARD: 'add_credit_card',
  UPDATE_CREDIT_CARD: 'update_credit_card',
  DELETE_CREDIT_CARD: 'delete_credit_card',
  LOG_IMPULSE_DIRECT: 'log_impulse_direct',
  LOG_IMPULSE_COOLDOWN: 'log_impulse_cooldown',
  CONNECT_SPLITWISE: 'connect_splitwise',
  DISCONNECT_SPLITWISE: 'disconnect_splitwise',
  SYNC_SPLITWISE: 'sync_splitwise',
  GENERAL: 'general',
} as const;
export type ChatIntent = (typeof ChatIntentEnum)[keyof typeof ChatIntentEnum];
export const CHAT_INTENTS = Object.values(ChatIntentEnum);
