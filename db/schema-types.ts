/**
 * Type definitions derived from database schema
 * Includes inferred types and input types for CRUD operations
 */

import type {
  categoriesTable,
  debtsTable,
  expensesTable,
  fixedExpensesTable,
  monthlySnapshotsTable,
  profileTable,
  savingsGoalsTable,
} from './schema';

// ============================================
// INFERRED TYPES FROM SCHEMA
// ============================================

export type Profile = typeof profileTable.$inferSelect;
export type NewProfile = typeof profileTable.$inferInsert;

export type FixedExpense = typeof fixedExpensesTable.$inferSelect;
export type NewFixedExpense = typeof fixedExpensesTable.$inferInsert;

export type Debt = typeof debtsTable.$inferSelect;
export type NewDebt = typeof debtsTable.$inferInsert;

export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Expense = typeof expensesTable.$inferSelect;
export type NewExpense = typeof expensesTable.$inferInsert;

export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;
export type NewSavingsGoal = typeof savingsGoalsTable.$inferInsert;

export type MonthlySnapshot = typeof monthlySnapshotsTable.$inferSelect;
export type NewMonthlySnapshot = typeof monthlySnapshotsTable.$inferInsert;

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
export type CreateDebtInput = Omit<Debt, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<Debt, 'customType' | 'startDate'>>;
export type UpdateDebtInput = Partial<Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>>;

// Categories
export type CreateCategoryInput = Pick<Category, 'name' | 'type'> &
  Partial<Pick<Category, 'customType' | 'icon' | 'color'>>;
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt'>>;

// Expenses
export type CreateExpenseInput = Pick<Expense, 'amount' | 'categoryId'> &
  Partial<Pick<Expense, 'description' | 'date' | 'wasImpulse'>>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt'>>;

// Savings Goals
export type CreateSavingsGoalInput = Pick<SavingsGoal, 'name' | 'type' | 'targetAmount'> &
  Partial<Pick<SavingsGoal, 'customType' | 'icon'>>;
export type UpdateSavingsGoalInput = Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>;

// Monthly Snapshots
export type CreateMonthlySnapshotInput = Pick<MonthlySnapshot, 'month' | 'frivolousBudget'> &
  Partial<Pick<MonthlySnapshot, 'rolloverFromPrevious'>>;
