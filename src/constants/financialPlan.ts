/**
 * Constants for Financial Plan types
 */

export const SuggestedChangeField = {
  MONTHLY_SAVINGS_TARGET: 'monthlySavingsTarget',
  FRIVOLOUS_BUDGET: 'frivolousBudget',
  FIXED_EXPENSE: 'fixedExpense',
  DEBT: 'debt',
  SAVINGS_GOAL: 'savingsGoal',
} as const;

export const BudgetCategory = {
  FIXED_EXPENSES: 'fixed_expenses',
  EMI_PAYMENTS: 'emi_payments',
  SAVINGS: 'savings',
  ESSENTIALS: 'essentials',
  DISCRETIONARY: 'discretionary',
} as const;

export const RecommendationPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
