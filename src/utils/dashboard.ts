import type { Debt, FixedExpense, SavingsGoal } from '@/db/schema-types';

/**
 * Calculate EMI (Equated Monthly Installment) for a loan
 */
export const calculateEMIFromDebt = (debt: { principal: number; interestRate: number; tenureMonths: number }) => {
  const { principal, interestRate, tenureMonths } = debt;
  if (tenureMonths === 0) return principal;
  const monthlyRate = interestRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  return Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );
};

/**
 * Map fixed expense to sheet format
 */
export const mapFixedExpenseToSheet = (expense: FixedExpense) => ({
  id: expense.id,
  name: expense.name,
  type: expense.type || expense.customType || '',
  amount: expense.amount,
});

/**
 * Map debt to sheet format
 */
export const mapDebtToSheet = (debt: Debt) => ({
  id: debt.id,
  name: debt.name,
  type: debt.type || debt.customType || '',
  emi: calculateEMIFromDebt(debt),
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
