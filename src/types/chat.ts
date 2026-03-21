import type {
  CategoryLabels,
  CategoryType,
  ChatIntentEnum,
  DebtType,
  FixedExpenseType,
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

export type ChatDeleteData = {
  existingName: string; // name of the entity to delete — always required
};

// ============================================
// DISCRIMINATED UNION
// Keyed on `intent` using ChatIntentEnum values so consumers can
// narrow with a switch/case using the same enum everywhere.
// ============================================

export type ChatResponse =
  | { intent: typeof ChatIntentEnum.ADD_EXPENSE; message: string; data: ChatExpenseData }
  | { intent: typeof ChatIntentEnum.UPDATE_PROFILE; message: string; data: ChatProfileUpdateData }
  | { intent: typeof ChatIntentEnum.ADD_FIXED_EXPENSE; message: string; data: ChatFixedExpenseData }
  | { intent: typeof ChatIntentEnum.UPDATE_FIXED_EXPENSE; message: string; data: ChatFixedExpenseData }
  | { intent: typeof ChatIntentEnum.DELETE_FIXED_EXPENSE; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.ADD_DEBT; message: string; data: ChatDebtData }
  | { intent: typeof ChatIntentEnum.UPDATE_DEBT; message: string; data: ChatDebtData }
  | { intent: typeof ChatIntentEnum.DELETE_DEBT; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.ADD_SAVINGS_GOAL; message: string; data: ChatSavingsGoalData }
  | { intent: typeof ChatIntentEnum.UPDATE_SAVINGS_GOAL; message: string; data: ChatSavingsGoalData }
  | { intent: typeof ChatIntentEnum.DELETE_SAVINGS_GOAL; message: string; data: ChatDeleteData }
  | { intent: typeof ChatIntentEnum.GENERAL; message: string; data?: undefined };
