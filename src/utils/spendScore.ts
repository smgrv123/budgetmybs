import type { ThemeColors } from '@/hooks/use-theme-color';

/**
 * Calculate monthly spend score (0-100)
 * Tracks how well the user stays within their budget each month
 */

type MonthlySpendData = {
  discretionarySpent: number;
  frivolousBudget: number;
  monthlySavings: number;
  savingsTarget: number;
  impulseCount: number;
  fixedExpensesPaid: boolean;
};

export const calculateSpendScore = (data: MonthlySpendData): number => {
  let score = 0;

  // Component 1: Under Frivolous Budget (40 points)
  if (data.discretionarySpent <= data.frivolousBudget) {
    score += 40;
  } else {
    // Partial credit if within 20% over budget
    const overagePercentage = (data.discretionarySpent - data.frivolousBudget) / data.frivolousBudget;
    if (overagePercentage <= 0.2) {
      score += Math.max(0, 40 - overagePercentage * 100);
    }
  }

  // Component 2: Savings Goal Met (30 points)
  if (data.monthlySavings >= data.savingsTarget) {
    score += 30;
  } else {
    // Proportional points based on savings rate
    const savingsRate = data.monthlySavings / data.savingsTarget;
    score += savingsRate * 30;
  }

  // Component 3: No Impulse Overspend (20 points)
  score += Math.max(0, 20 - 2 * data.impulseCount);

  // Component 4: Fixed Expenses Paid (10 points)
  if (data.fixedExpensesPaid) {
    score += 10;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Get spend score info including color and label based on score value
 * @param score - The spend score (0-100)
 * @param themeColors - Theme colors object for dynamic theming
 * @returns Object containing color (hex) and label (string)
 */
export const getSpendScoreInfo = (score: number, themeColors: ThemeColors): { color: string; label: string } => {
  if (score >= 80) {
    return { color: themeColors.success, label: 'Excellent' };
  }
  if (score >= 60) {
    return { color: themeColors.warning, label: 'Good' };
  }
  if (score >= 40) {
    return { color: themeColors.warning, label: 'Fair' };
  }
  return { color: themeColors.danger, label: 'Needs Improvement' };
};
