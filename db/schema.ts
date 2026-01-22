import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { CategoryType, DebtType, FixedExpenseType, SavingsType } from './types';
import { generateUUID } from './utils';

// ============================================
// PROFILE TABLE
// ============================================

export const profileTable = sqliteTable('profile', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  name: text('name').notNull(),
  salary: real('salary').notNull(),
  frivolousBudget: real('frivolous_budget').notNull(),
  monthlySavingsTarget: real('monthly_savings_target').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// FIXED EXPENSES TABLE
// ============================================

export const fixedExpensesTable = sqliteTable('fixed_expenses', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  name: text('name').notNull(),
  type: text('type').$type<FixedExpenseType>().notNull(),
  customType: text('custom_type'), // Only if type = "other"
  amount: real('amount').notNull(),
  dayOfMonth: integer('day_of_month'), // 1-31, null = anytime
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// DEBTS TABLE
// ============================================

export const debtsTable = sqliteTable('debts', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  name: text('name').notNull(),
  type: text('type').$type<DebtType>().notNull(),
  customType: text('custom_type'), // Only if type = "other"
  principal: real('principal').notNull(),
  remaining: real('remaining').notNull(),
  interestRate: real('interest_rate').notNull(), // Annual %
  emiAmount: real('emi_amount').notNull(),
  tenureMonths: integer('tenure_months').notNull(),
  remainingMonths: integer('remaining_months').notNull(),
  startDate: text('start_date'), // Optional
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CATEGORIES TABLE
// ============================================

export const categoriesTable = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  name: text('name').notNull(),
  type: text('type').$type<CategoryType>().notNull(),
  customType: text('custom_type'), // Only if type = "other"
  icon: text('icon'),
  color: text('color'),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// EXPENSES TABLE
// ============================================

export const expensesTable = sqliteTable('expenses', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  amount: real('amount').notNull(),
  categoryId: text('category_id'), // FK to categories, null for savings
  description: text('description'),
  date: text('date')
    .notNull()
    .default(sql`(date('now'))`), // YYYY-MM-DD
  wasImpulse: integer('was_impulse').notNull().default(0),
  isSaving: integer('is_saving').notNull().default(0), // 1 = one-off saving, 0 = expense
  savingsType: text('savings_type').$type<SavingsType>(), // Only if isSaving = 1
  customSavingsType: text('custom_savings_type'), // Only if savingsType = "other"
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SAVINGS GOALS TABLE
// ============================================

export const savingsGoalsTable = sqliteTable('savings_goals', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  name: text('name').notNull(),
  type: text('type').$type<SavingsType>().notNull(),
  customType: text('custom_type'), // Only if type = "other"
  targetAmount: real('target_amount').notNull(),
  icon: text('icon'),
  isActive: integer('is_active').notNull().default(1),
  isCompleted: integer('is_completed').notNull().default(0), // 1 = goal completed
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// MONTHLY SNAPSHOTS TABLE
// ============================================

export const monthlySnapshotsTable = sqliteTable('monthly_snapshots', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  month: text('month').notNull().unique(), // YYYY-MM
  frivolousBudget: real('frivolous_budget').notNull(),
  rolloverFromPrevious: real('rollover_from_previous').notNull().default(0),
  isClosed: integer('is_closed').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// RELATIONS
// ============================================

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [expensesTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  expenses: many(expensesTable),
}));
