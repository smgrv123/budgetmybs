import type {
  CategoryLabels,
  CategoryType,
  ChatIntentEnum,
  DebtType,
  FixedExpenseType,
  IncomeType,
  ProfileFieldType,
  SavingsType,
} from '@/db/types';

// ============================================
// HELPER TYPES
// ============================================

/** Union of all valid category display names (e.g. 'Food & Dining' | 'Shopping' | ...) */
export type CategoryName = (typeof CategoryLabels)[CategoryType];

// ============================================
// DATA SHAPES PER INTENT
// ============================================

export type ChatExpenseData = {
  amount: number;
  category?: CategoryName; // must be an exact category name from CategoryLabels
  description?: string;
  creditCard?: string | null; // matched card nickname; null when AI couldn't identify a card
};

export type ChatProfileUpdateData = {
  field: ProfileFieldType; // uses ProfileFieldEnum from db/types.ts
  value: number;
};

export type ChatFixedExpenseData = {
  name?: string; // new name (or name for add); if present alongside existingName, it's a rename
  type?: FixedExpenseType; // required for add, optional for update
  amount?: number;
  dayOfMonth?: number;
  existingName?: string; // required for update/delete — identifies the target
};

export type ChatDebtData = {
  name?: string;
  type?: DebtType;
  principal?: number;
  interestRate?: number;
  emiAmount?: number;
  tenureMonths?: number;
  remainingMonths?: number;
  remaining?: number;
  existingName?: string;
};

export type ChatSavingsGoalData = {
  name?: string;
  type?: SavingsType;
  targetAmount?: number;
  existingName?: string;
};

export type ChatIncomeData = {
  amount: number;
  type: IncomeType;
  customType?: string;
  description?: string;
  date: string;
};

export type ChatSavingsData = {
  amount: number;
  savingsGoalId: string | null; // null = ad-hoc
  savingsType: SavingsType; // required; for ad-hoc must be a valid SavingsType
  description?: string;
};

export type ChatWithdrawalData = {
  amount: number;
  sourceId: string; // goal id or savingsType string (for ad-hoc)
  sourceLabel: string; // human-readable label shown in the form
  availableBalance: number;
  savingsGoalId: string | null; // null for ad-hoc withdrawals
  savingsType: SavingsType | null; // null only if unresolvable (should not happen)
};

export type ChatDeleteData = {
  existingName: string; // name of the entity to delete — always required
};

export type ChatUpdateExpenseData = {
  expenseId: string;
  amount?: number;
  categoryId?: string;
  description?: string;
  creditCard?: string | null;
  date?: string;
};

export type ChatDeleteExpenseData = {
  expenseId: string;
  description?: string;
  amount?: number;
};

export type ChatUpdateIncomeData = {
  incomeId: string;
  amount?: number;
  type?: IncomeType;
  description?: string;
  date?: string;
};

export type ChatDeleteIncomeData = {
  incomeId: string;
  type?: string;
  amount?: number;
};

export type ChatAddCreditCardData = {
  nickname: string;
  bank: string;
  provider: string;
  last4: string;
  creditLimit?: number;
  statementDayOfMonth?: number;
  paymentBufferDays?: number;
};

export type ChatUpdateCreditCardData = {
  existingNickname: string;
  nickname?: string;
  bank?: string;
  provider?: string;
  last4?: string;
  creditLimit?: number;
  statementDayOfMonth?: number;
  paymentBufferDays?: number;
};

export type ChatDeleteCreditCardData = {
  existingNickname: string;
};

// ============================================
// DISCRIMINATED UNION
// Keyed on `intent` using ChatIntentEnum values so consumers can
// narrow with a switch/case using the same enum everywhere.
// ============================================

export type ChatImpulseCooldownData = {
  amount: number;
  category?: string;
  description?: string;
  creditCard?: string | null;
  cooldownMinutes: number;
};

export type ChatResponse =
  | { intent: typeof ChatIntentEnum.ADD_EXPENSE; message: string; data: ChatExpenseData }
  | { intent: typeof ChatIntentEnum.UPDATE_PROFILE; message: string; data: ChatProfileUpdateData }
  | { intent: typeof ChatIntentEnum.ADD_FIXED_EXPENSE; message: string; data: ChatFixedExpenseData }
  | { intent: typeof ChatIntentEnum.UPDATE_FIXED_EXPENSE; message: string; data: ChatFixedExpenseData }
  | { intent: typeof ChatIntentEnum.DELETE_FIXED_EXPENSE; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.ADD_DEBT; message: string; data: ChatDebtData }
  | { intent: typeof ChatIntentEnum.UPDATE_DEBT; message: string; data: ChatDebtData }
  | { intent: typeof ChatIntentEnum.DELETE_DEBT; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.ADD_MONTHLY_SAVINGS; message: string; data: ChatSavingsGoalData }
  | { intent: typeof ChatIntentEnum.UPDATE_MONTHLY_SAVINGS; message: string; data: ChatSavingsGoalData }
  | { intent: typeof ChatIntentEnum.DELETE_MONTHLY_SAVINGS; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.ADD_INCOME; message: string; data: ChatIncomeData }
  | { intent: typeof ChatIntentEnum.LOG_SAVINGS; message: string; data: ChatSavingsData }
  | { intent: typeof ChatIntentEnum.WITHDRAW_SAVINGS; message: string; data: ChatWithdrawalData }
  | { intent: typeof ChatIntentEnum.UPDATE_EXPENSE; message: string; data: ChatUpdateExpenseData }
  | { intent: typeof ChatIntentEnum.DELETE_EXPENSE; message: string; data: ChatDeleteExpenseData }
  | { intent: typeof ChatIntentEnum.UPDATE_INCOME; message: string; data: ChatUpdateIncomeData }
  | { intent: typeof ChatIntentEnum.DELETE_INCOME; message: string; data: ChatDeleteIncomeData }
  | { intent: typeof ChatIntentEnum.ADD_CREDIT_CARD; message: string; data: ChatAddCreditCardData }
  | { intent: typeof ChatIntentEnum.UPDATE_CREDIT_CARD; message: string; data: ChatUpdateCreditCardData }
  | { intent: typeof ChatIntentEnum.DELETE_CREDIT_CARD; message: string; data: ChatDeleteCreditCardData }
  | { intent: typeof ChatIntentEnum.LOG_IMPULSE_DIRECT; message: string; data: ChatExpenseData }
  | { intent: typeof ChatIntentEnum.LOG_IMPULSE_COOLDOWN; message: string; data: ChatImpulseCooldownData }
  | { intent: typeof ChatIntentEnum.CONNECT_SPLITWISE; message: string; data?: Record<string, never> }
  | { intent: typeof ChatIntentEnum.DISCONNECT_SPLITWISE; message: string; data?: Record<string, never> }
  | { intent: typeof ChatIntentEnum.SYNC_SPLITWISE; message: string; data?: Record<string, never> }
  | { intent: typeof ChatIntentEnum.GENERAL; message: string; data?: undefined };
