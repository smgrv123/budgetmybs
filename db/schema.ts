import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type {
  CategoryType,
  ChatActionStatus,
  ChatActionType,
  ChatRole,
  CreditCardProvider,
  CreditCardTxnType,
  DebtPayoffPreference,
  DebtType,
  FixedExpenseType,
  RecurringSourceType,
  SavingsType,
} from './types';
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
  debtPayoffPreference: text('debt_payoff_preference').$type<DebtPayoffPreference>().default('avalanche'),
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
  dayOfMonth: integer('day_of_month').notNull().default(1), // 1-31, nullable
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
  dayOfMonth: integer('day_of_month').notNull().default(1), // 1-31, nullable
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CREDIT CARDS TABLE
// ============================================

export const creditCardsTable = sqliteTable('credit_cards', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  nickname: text('nickname').notNull(),
  provider: text('provider').$type<CreditCardProvider>().notNull(),
  bank: text('bank').notNull(),
  last4: text('last4').notNull(),
  creditLimit: real('credit_limit').notNull(),
  statementDayOfMonth: integer('statement_day_of_month').notNull(),
  paymentBufferDays: integer('payment_buffer_days').notNull(),
  usedAmount: real('used_amount').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CREDIT CARD EXPENSES TABLE
// ============================================

export const creditCardExpensesTable = sqliteTable('credit_card_expenses', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  creditCardId: text('credit_card_id').notNull(),
  expenseId: text('expense_id').notNull().unique(),
  statementMonth: text('statement_month').notNull(), // YYYY-MM
  statementEndDate: text('statement_end_date').notNull(), // YYYY-MM-DD
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CREDIT CARD PAYMENTS TABLE
// ============================================

export const creditCardPaymentsTable = sqliteTable('credit_card_payments', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  creditCardId: text('credit_card_id').notNull(),
  expenseId: text('expense_id').notNull().unique(),
  createdAt: text('created_at')
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
  sourceType: text('source_type').$type<RecurringSourceType | null>().default(null), // fixed_expense | debt_emi | null
  sourceId: text('source_id'), // origin row id
  sourceMonth: text('source_month'), // YYYY-MM
  creditCardId: text('credit_card_id'),
  creditCardTxnType: text('credit_card_txn_type').$type<CreditCardTxnType | null>().default(null), // purchase | payment | null
  excludeFromSpending: integer('exclude_from_spending').notNull().default(0), // 1 = excluded from spend totals
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
// FINANCIAL PLANS TABLE
// ============================================
/**
 * Stores AI-generated financial plans with complete user data snapshots.
 *
 * PURPOSE:
 * This table provides version history and analytics capabilities for the AI financial advisor.
 * While the AI suggestions are applied directly to the profile/debts/expenses tables,
 * keeping a historical record enables powerful future features.
 *
 * USE CASES:
 * 1. **Version History & Audit Trail**
 *    - Track what the AI originally suggested during onboarding
 *    - Compare multiple AI-generated plans over time as user's situation changes
 *    - Allow users to see: "What did the AI recommend 3 months ago?"
 *
 * 2. **Rollback Functionality**
 *    - If user doesn't like changes after applying AI suggestions, can restore previous state
 *    - Safety net for non-technical users who want to undo changes
 *    - Especially useful if implementing "regenerate plan" feature
 *
 * 3. **Analytics & Progress Tracking**
 *    - Dashboard feature: "Your financial health improved from 45 → 78 over 6 months"
 *    - Show timeline of health score improvements
 *    - Motivational insights based on historical data
 *    - Track how recommendations evolved
 *
 * 4. **AI Model Improvements**
 *    - Compare suggestions from different Gemini model versions
 *    - A/B testing different prompts or strategies
 *    - Quality assurance and debugging
 *
 * DATA STRUCTURE:
 * - Snapshots: Complete user data at time of plan generation (profile, debts, expenses, goals)
 * - Plan: Full AI-generated recommendations and analysis
 * - isActive: Only one plan is "current" at a time (most recent)
 *
 * FUTURE-PROOFING:
 * Even if not used immediately, this minimal storage cost enables rich features later
 * without requiring schema migrations or data reconstruction.
 */
export const financialPlansTable = sqliteTable('financial_plans', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  // Snapshot of user data at time of plan generation
  profileSnapshot: text('profile_snapshot').notNull(), // JSON: ProfileData
  fixedExpensesSnapshot: text('fixed_expenses_snapshot').notNull(), // JSON: FixedExpenseData[]
  debtsSnapshot: text('debts_snapshot').notNull(), // JSON: DebtData[]
  savingsGoalsSnapshot: text('savings_goals_snapshot').notNull(), // JSON: SavingsGoalData[]
  // AI-generated plan
  plan: text('plan').notNull(), // JSON: FinancialPlan
  isActive: integer('is_active').notNull().default(1), // Current active plan
  createdAt: text('created_at')
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
  salary: real('salary').notNull().default(0),
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
// CHAT MESSAGES TABLE
// ============================================

export const chatMessagesTable = sqliteTable('chat_messages', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  role: text('role').$type<ChatRole>().notNull(),
  content: text('content').notNull(),
  actionType: text('action_type').$type<ChatActionType>(),
  actionData: text('action_data', { mode: 'json' }).$type<Record<string, unknown>>(),
  actionStatus: text('action_status').$type<ChatActionStatus>(),
  quotedMessageId: text('quoted_message_id'),
  createdAt: text('created_at')
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
  creditCard: one(creditCardsTable, {
    fields: [expensesTable.creditCardId],
    references: [creditCardsTable.id],
  }),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  expenses: many(expensesTable),
}));

export const creditCardsRelations = relations(creditCardsTable, ({ many }) => ({
  expenses: many(expensesTable),
  cardExpenses: many(creditCardExpensesTable),
  cardPayments: many(creditCardPaymentsTable),
}));

export const creditCardExpensesRelations = relations(creditCardExpensesTable, ({ one }) => ({
  creditCard: one(creditCardsTable, {
    fields: [creditCardExpensesTable.creditCardId],
    references: [creditCardsTable.id],
  }),
  expense: one(expensesTable, {
    fields: [creditCardExpensesTable.expenseId],
    references: [expensesTable.id],
  }),
}));

export const creditCardPaymentsRelations = relations(creditCardPaymentsTable, ({ one }) => ({
  creditCard: one(creditCardsTable, {
    fields: [creditCardPaymentsTable.creditCardId],
    references: [creditCardsTable.id],
  }),
  expense: one(expensesTable, {
    fields: [creditCardPaymentsTable.expenseId],
    references: [expensesTable.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  quotedMessage: one(chatMessagesTable, {
    fields: [chatMessagesTable.quotedMessageId],
    references: [chatMessagesTable.id],
  }),
}));
