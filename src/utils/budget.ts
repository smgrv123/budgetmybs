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

/**
 * Calculate total of all fixed expenses
 * Generic function that accepts both database types (FixedExpense with id, createdAt, etc.)
 * and onboarding types (FixedExpenseData with tempId) - only requires `amount` property
 */
export const calculateTotalFixedExpenses = <T extends { amount: number }>(fixedExpenses: T[]): number => {
  return fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
};

/**
 * Calculate total EMI across all debts
 * Generic function that accepts both database types (Debt) and onboarding types (DebtData)
 * Only requires the three properties needed for EMI calculation
 */
export const calculateTotalEMI = <T extends { principal: number; interestRate: number; tenureMonths: number }>(
  debts: T[]
): number => {
  return debts.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0);
};
