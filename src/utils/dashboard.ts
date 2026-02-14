import type { Debt, FixedExpense, SavingsGoal } from '@/db/schema-types';

/**
 * Map fixed expense to sheet format
 */
export const mapFixedExpenseToSheet = (expense: FixedExpense, isPaidThisMonth = false) => ({
  id: expense.id,
  name: expense.name,
  type: expense.type || expense.customType || '',
  amount: expense.amount,
  dayOfMonth: expense.dayOfMonth,
  isPaidThisMonth,
});

/**
 * Map debt to sheet format
 */
export const mapDebtToSheet = (debt: Debt, isPaidThisMonth = false) => ({
  id: debt.id,
  name: debt.name,
  type: debt.type || debt.customType || '',
  emi: debt.emiAmount,
  dayOfMonth: debt.dayOfMonth,
  isPaidThisMonth,
});

/**
 * Map savings goal to sheet format
 */
export const mapSavingsGoalToSheet = (goal: SavingsGoal) => ({
  id: goal.id,
  name: goal.name,
  type: goal.type || goal.customType || '',
  targetAmount: goal.targetAmount,
  isCompleted: !!goal.isCompleted,
});
