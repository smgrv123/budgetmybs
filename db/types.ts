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
  RENT: "rent",
  UTILITIES: "utilities",
  INTERNET: "internet",
  PHONE: "phone",
  INSURANCE: "insurance",
  SUBSCRIPTIONS: "subscriptions",
  EMI: "emi",
  GROCERIES: "groceries",
  TRANSPORT: "transport",
  DOMESTIC_HELP: "domestic_help",
  OTHER: "other",
} as const;

export type FixedExpenseType =
  (typeof FixedExpenseTypeEnum)[keyof typeof FixedExpenseTypeEnum];

export const FIXED_EXPENSE_TYPES = Object.values(FixedExpenseTypeEnum);

/**
 * Debt types
 */
export const DebtTypeEnum = {
  HOME_LOAN: "home_loan",
  CAR_LOAN: "car_loan",
  PERSONAL_LOAN: "personal_loan",
  EDUCATION_LOAN: "education_loan",
  CREDIT_CARD: "credit_card",
  GOLD_LOAN: "gold_loan",
  BUSINESS_LOAN: "business_loan",
  OTHER: "other",
} as const;

export type DebtType = (typeof DebtTypeEnum)[keyof typeof DebtTypeEnum];

export const DEBT_TYPES = Object.values(DebtTypeEnum);

/**
 * Category types for variable expenses
 */
export const CategoryTypeEnum = {
  FOOD: "food",
  SHOPPING: "shopping",
  ENTERTAINMENT: "entertainment",
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  PERSONAL_CARE: "personal_care",
  GIFTS: "gifts",
  TRAVEL: "travel",
  FITNESS: "fitness",
  OTHER: "other",
} as const;

export type CategoryType =
  (typeof CategoryTypeEnum)[keyof typeof CategoryTypeEnum];

export const CATEGORY_TYPES = Object.values(CategoryTypeEnum);

/**
 * Savings goal types
 */
export const SavingsTypeEnum = {
  FD: "fd",
  RD: "rd",
  MUTUAL_FUNDS: "mutual_funds",
  STOCKS: "stocks",
  PPF: "ppf",
  NPS: "nps",
  GOLD: "gold",
  CRYPTO: "crypto",
  EMERGENCY_FUND: "emergency_fund",
  OTHER: "other",
} as const;

export type SavingsType =
  (typeof SavingsTypeEnum)[keyof typeof SavingsTypeEnum];

export const SAVINGS_TYPES = Object.values(SavingsTypeEnum);

// ============================================
// DISPLAY LABELS (for UI)
// ============================================

export const FixedExpenseLabels: Record<FixedExpenseType, string> = {
  rent: "Rent",
  utilities: "Utilities",
  internet: "Internet",
  phone: "Phone",
  insurance: "Insurance",
  subscriptions: "Subscriptions",
  emi: "EMI",
  groceries: "Groceries",
  transport: "Transport",
  domestic_help: "Domestic Help",
  other: "Other",
};

export const DebtLabels: Record<DebtType, string> = {
  home_loan: "Home Loan",
  car_loan: "Car Loan",
  personal_loan: "Personal Loan",
  education_loan: "Education Loan",
  credit_card: "Credit Card",
  gold_loan: "Gold Loan",
  business_loan: "Business Loan",
  other: "Other",
};

export const CategoryLabels: Record<CategoryType, string> = {
  food: "Food & Dining",
  shopping: "Shopping",
  entertainment: "Entertainment",
  healthcare: "Healthcare",
  education: "Education",
  personal_care: "Personal Care",
  gifts: "Gifts",
  travel: "Travel",
  fitness: "Fitness",
  other: "Other",
};

export const SavingsLabels: Record<SavingsType, string> = {
  fd: "Fixed Deposit",
  rd: "Recurring Deposit",
  mutual_funds: "Mutual Funds",
  stocks: "Stocks",
  ppf: "PPF",
  nps: "NPS",
  gold: "Gold",
  crypto: "Crypto",
  emergency_fund: "Emergency Fund",
  other: "Other",
};
