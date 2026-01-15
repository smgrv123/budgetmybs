import type { DebtData, FixedExpenseData } from '@/src/types';

/**
 * Calculate EMI using the formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 *
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (percentage, e.g., 10 for 10%)
 * @param tenureMonths - Loan tenure in months
 * @returns Monthly EMI amount (rounded to nearest rupee)
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;

  // If no interest, simple division
  if (annualRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const r = annualRate / 12 / 100; // Monthly interest rate
  const n = tenureMonths;

  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return Math.round(emi);
}

export const calculateTotalFixedExpenses = (fixedExpenses: FixedExpenseData[]): number => {
  return fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
};

export const calculateTotalEMI = (debts: DebtData[]): number => {
  return debts.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0);
};

export const getPercentage = (amount: number, totalIncome: number): number => {
  if (totalIncome <= 0) return 0;
  return Math.round((amount / totalIncome) * 100);
};

// Budget Breakdown Items Logic
export type BudgetBreakdownItem = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
};

export const buildBudgetBreakdownItems = (
  totalFixedExpenses: number,
  totalEMI: number,
  savingsTarget: number,
  remainingBudget: number,
  categories: {
    fixedExpenses: string;
    emiPayments: string;
    savingsTarget: string;
    groceriesEssentials: string;
  },
  salary: number
): BudgetBreakdownItem[] => {
  const items: BudgetBreakdownItem[] = [];

  const getPercent = (amount: number) => getPercentage(amount, salary);

  if (totalFixedExpenses > 0) {
    items.push({
      id: 'fixed-expenses',
      name: categories.fixedExpenses,
      amount: totalFixedExpenses,
      percentage: getPercent(totalFixedExpenses),
    });
  }

  if (totalEMI > 0) {
    items.push({
      id: 'emi-payments',
      name: categories.emiPayments,
      amount: totalEMI,
      percentage: getPercent(totalEMI),
    });
  }

  if (savingsTarget > 0) {
    items.push({
      id: 'savings-target',
      name: categories.savingsTarget,
      amount: savingsTarget,
      percentage: getPercent(savingsTarget),
    });
  }

  if (remainingBudget > 0) {
    items.push({
      id: 'groceries-essentials',
      name: categories.groceriesEssentials,
      amount: remainingBudget,
      percentage: getPercent(remainingBudget),
    });
  }

  return items;
};
