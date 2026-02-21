/**
 * Loading messages and tips that cycle while AI generates the financial plan
 * Mix of progress indicators and valuable financial insights
 */

export const PLAN_LOADING_MESSAGES = [
  'Analyzing your financial profile...',
  'The 50-30-20 rule: 50% needs, 30% wants, 20% savings',
  'Calculating your health score...',
  'Emergency fund goal: 3-6 months of expenses',
  'Optimizing your budget allocation...',
  'High-interest debts should be paid off first',
  'Generating personalized recommendations...',
  'Start investing early to benefit from compounding',
  'Evaluating debt payoff strategies...',
  'Automate your savings to make it effortless',
  'Creating your savings roadmap...',
  'Track every expense for better money awareness',
  'Finalizing your financial plan...',
  'Budget for annual expenses monthly to avoid surprises',
  'Almost there...',
  'Avoid lifestyle inflation as your income grows',
] as const;

/**
 * Duration in milliseconds for each message rotation
 */
export const MESSAGE_ROTATION_DURATION_MS = 1500;
