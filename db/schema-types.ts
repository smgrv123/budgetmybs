/**
 * Type definitions derived from database schema
 * Includes inferred types and input types for CRUD operations
 */

// Import types first to avoid circular dependencies
import type { FinancialPlan } from '@/src/types/financialPlan';
import type { DebtData, FixedExpenseData, ProfileData, SavingsGoalData } from '@/src/types/onboarding';

import type {
  categoriesTable,
  chatMessagesTable,
  creditCardExpensesTable,
  creditCardPaymentsTable,
  creditCardsTable,
  debtsTable,
  expensesTable,
  financialPlansTable,
  fixedExpensesTable,
  additionalIncomeTable,
  monthlySnapshotsTable,
  profileTable,
  savingsGoalsTable,
} from './schema';

// ============================================
// INFERRED TYPES FROM SCHEMA
// ============================================

export type Profile = typeof profileTable.$inferSelect;

export type FixedExpense = typeof fixedExpensesTable.$inferSelect;

export type Debt = typeof debtsTable.$inferSelect;

export type CreditCard = typeof creditCardsTable.$inferSelect;

export type CreditCardExpense = typeof creditCardExpensesTable.$inferSelect;

export type CreditCardPayment = typeof creditCardPaymentsTable.$inferSelect;

export type Category = typeof categoriesTable.$inferSelect;

export type Expense = typeof expensesTable.$inferSelect;

export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;

export type Income = typeof additionalIncomeTable.$inferSelect;

export type MonthlySnapshot = typeof monthlySnapshotsTable.$inferSelect;

export type FinancialPlanRecord = typeof financialPlansTable.$inferSelect;

// ============================================
// INPUT TYPES FOR CRUD OPERATIONS
// ============================================

// Profile
export type CreateProfileInput = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProfileInput = Partial<CreateProfileInput>;

// Fixed Expenses
export type CreateFixedExpenseInput = Pick<FixedExpense, 'name' | 'type' | 'amount'> &
  Partial<Pick<FixedExpense, 'customType' | 'dayOfMonth'>>;
export type UpdateFixedExpenseInput = Partial<Omit<FixedExpense, 'id' | 'createdAt' | 'updatedAt'>>;

// Debts
export type CreateDebtInput = Omit<Debt, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'dayOfMonth'> &
  Partial<Pick<Debt, 'customType' | 'startDate' | 'dayOfMonth'>>;
export type UpdateDebtInput = Partial<Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>>;

// Credit Cards
export type CreateCreditCardInput = Omit<CreditCard, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'usedAmount'>;
export type UpdateCreditCardInput = Partial<Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>>;

// Credit Card Payments
export type CreateCreditCardPaymentInput = {
  creditCardId: string;
  amount: number;
  date?: string;
};

// Categories
export type CreateCategoryInput = Pick<Category, 'name' | 'type'> &
  Partial<Pick<Category, 'customType' | 'icon' | 'color'>>;
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt'>>;

// Expenses
export type CreateExpenseInput = Pick<Expense, 'amount'> & Partial<Omit<Expense, 'id' | 'amount' | 'createdAt'>>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt'>>;

// One-off Savings (convenience type for type safety)
export type CreateOneOffSavingInput = Pick<Expense, 'amount' | 'savingsType'> &
  Partial<Pick<Expense, 'description' | 'date' | 'customSavingsType'>>;

// Income
export type CreateIncomeInput = Pick<Income, 'amount' | 'type'> &
  Partial<Pick<Income, 'customType' | 'date' | 'description'>>;
export type UpdateIncomeInput = Partial<Omit<Income, 'id' | 'createdAt'>>;

// Savings Goals
export type CreateSavingsGoalInput = Pick<SavingsGoal, 'name' | 'type' | 'targetAmount'> &
  Partial<Pick<SavingsGoal, 'customType' | 'icon'>>;
export type UpdateSavingsGoalInput = Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>;

// Financial Plans - Input Types
export type CreateFinancialPlanInput = {
  profileSnapshot: ProfileData;
  fixedExpensesSnapshot: FixedExpenseData[];
  debtsSnapshot: DebtData[];
  savingsGoalsSnapshot: SavingsGoalData[];
  plan: FinancialPlan;
};

// Monthly Snapshots
export type CreateMonthlySnapshotInput = Pick<MonthlySnapshot, 'month' | 'frivolousBudget' | 'salary'> &
  Partial<Pick<MonthlySnapshot, 'rolloverFromPrevious'>>;

// ============================================
// CUSTOM QUERY RESULT TYPES
// ============================================

export type AmountDue = {
  carried: number;
  newPurchases: number;
  total: number;
};

export type CreditCardSummary = Pick<CreditCard, 'creditLimit' | 'usedAmount'> & {
  cardId: CreditCard['id'];
  utilizationPercent: number;
  amountDue: AmountDue;
  dueDate: string | null;
};

// ============================================
// SAVINGS BALANCE QUERY RESULT TYPES
// ============================================

export type SavingsBalance = {
  deposited: number;
  withdrawn: number;
  net: number;
};

export type GoalSavingsBalance = SavingsBalance & {
  goalId: string;
  goalName: string;
  goalType: string;
};

export type AdHocSavingsBalance = SavingsBalance & {
  savingsType: string;
};

export type MonthlyGoalDeposit = {
  goalId: string;
  totalDeposited: number;
};

// ============================================
// CHAT MESSAGE TYPES
// ============================================

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;

export type CreateChatMessageInput = Pick<ChatMessage, 'role' | 'content'> &
  Partial<Pick<ChatMessage, 'actionType' | 'actionData' | 'actionStatus' | 'quotedMessageId'>>;
export type UpdateChatMessageInput = Partial<Pick<ChatMessage, 'actionStatus'>>;
