import type { DebtData, FixedExpenseData, ProfileData, SavingsGoalData } from '@/src/types';
import type { FinancialPlan } from '@/src/types/financialPlan';
import { calculateEMI, calculateTotalEMI, calculateTotalFixedExpenses } from '@/src/utils/budget';

import { generateJSON } from './gemini';

type OnboardingData = {
  profile: ProfileData;
  fixedExpenses: FixedExpenseData[];
  debts: DebtData[];
  savingsGoals: SavingsGoalData[];
};

/**
 * JSON schema for Gemini financial plan response
 * Defines the exact structure expected from the AI
 * Using a JSON object (not string template) for better maintainability and syntax highlighting
 */
const FINANCIAL_PLAN_JSON_SCHEMA = {
  summary: 'string - 2-3 sentence overview of their financial health and main recommendation',

  originalHealthScore: 'number (0-100)',
  originalHealthScoreWeights: {
    debtToIncomeWeight: 'number',
    savingsRateWeight: 'number',
    expenseRatioWeight: 'number',
    cushionWeight: 'number',
  },

  suggestedHealthScore: 'number (0-100)',
  suggestedHealthScoreWeights: {
    debtToIncomeWeight: 'number',
    savingsRateWeight: 'number',
    expenseRatioWeight: 'number',
    cushionWeight: 'number',
  },

  suggestedChanges: [
    {
      field: 'monthlySavingsTarget | frivolousBudget | fixedExpense | savingsGoal',
      itemId: 'string (only for list items)',
      itemName: 'string (only for list items)',
      currentValue: 'number',
      suggestedValue: 'number',
      reason: 'string - why this change',
      impact: "string - e.g., '+₹3,000/month savings'",
    },
  ],

  budgetAllocation: [
    {
      category: 'fixed_expenses | emi_payments | savings | essentials | discretionary',
      label: 'string - display label',
      amount: 'number',
      percentage: 'number',
    },
  ],

  debtPayoffPlan: [
    {
      debtName: 'string',
      priority: 'number (1 = pay first)',
      currentEMI: 'number',
      suggestedExtraPayment: 'number',
      reason: 'string',
    },
  ],

  savingsPhases: [
    {
      phase: 'number',
      title: 'string',
      duration: "string (e.g., '3-6 months')",
      monthlyTarget: 'number',
      actions: ['string'],
    },
  ],

  recommendations: [
    {
      priority: 'high | medium | low',
      title: 'string',
      description: 'string',
    },
  ],

  keyInsights: ['string - bullet point insights'],
};

/**
 * Build comprehensive financial analysis prompt for Gemini
 */
const buildFinancialPlanPrompt = (data: OnboardingData): string => {
  const { profile, fixedExpenses, debts, savingsGoals } = data;

  // Calculate totals using existing utility functions
  const totalFixedExpenses = calculateTotalFixedExpenses(fixedExpenses);
  const totalEMI = calculateTotalEMI(debts);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Format lists for prompt
  const fixedExpensesList = fixedExpenses
    .map((e) => `  - ${e.name} (${e.type}): ₹${e.amount}${e.dayOfMonth ? ` on day ${e.dayOfMonth}` : ''}`)
    .join('\n');

  const debtsList = debts
    .map((d) => {
      const emi = calculateEMI(d.principal, d.interestRate, d.tenureMonths);
      return `  - ${d.name} (${d.type}): Principal ₹${d.principal}, ${d.interestRate}% APR, EMI ₹${emi}, ${d.tenureMonths} months tenure`;
    })
    .join('\n');

  const savingsGoalsList = savingsGoals.map((g) => `  - ${g.name} (${g.type}): ₹${g.targetAmount}/month`).join('\n');

  return `You are an expert personal finance advisor specializing in Indian household budgeting. Your role is to analyze a user's complete financial profile and provide actionable, personalized recommendations.

## USER'S FINANCIAL PROFILE

### Income
- Monthly Salary (Net, post-tax): ₹${profile.salary}

### Current Allocations (User-defined)
- Monthly Savings Target: ₹${profile.monthlySavingsTarget}
- Fun Money / Discretionary Budget: ₹${profile.frivolousBudget}
- Debt Payoff Preference: ${profile.debtPayoffPreference} (avalanche = highest interest first, snowball = smallest balance first)

### Fixed Monthly Expenses (₹${totalFixedExpenses} total)
${fixedExpensesList || '  - None'}

### Active Debts (Total EMI: ₹${totalEMI}/month)
${debtsList || '  - None'}

### Monthly Savings Goals (₹${totalSavingsTarget} total)
${savingsGoalsList || '  - None'}

---

## YOUR ANALYSIS TASKS

1. **Calculate Health Scores (0-100)**
   - Generate scores for BOTH their CURRENT situation AND your SUGGESTED changes
   - For each scenario, include the weights you used:
     - debtToIncomeWeight (e.g., 0.3 if debts are a major concern)
     - savingsRateWeight (e.g., 0.25)
     - expenseRatioWeight (e.g., 0.25)
     - cushionWeight (discretionary buffer, e.g., 0.2)
   - Weights MUST sum to 1.0 in each scenario

2. **Suggested Changes**
   - Identify specific items to adjust (e.g., reduce a fixed expense, increase savings target)
   - Include itemId/itemName for list items (debts, expenses, savings goals)
   - Provide clear reason and impact for each change

3. **Budget Allocation Breakdown**
   - Show how their income SHOULD be distributed across:
     - fixed_expenses (rent, utilities, etc.)
     - emi_payments (debt servicing)
     - savings (investments, emergency fund)
     - essentials (groceries, transport after fixed costs)
     - discretionary (fun money, dining out)
   - Include amounts and percentages

4. **Debt Payoff Strategy**
   - Prioritize debts based on user's preference (avalanche/snowball)
   - Suggest extra payments if budget allows
   - Explain the reasoning

5. **Savings Roadmap**
   - Break down into phases (e.g., emergency fund → long-term investments)
   - Provide monthly targets and action steps

6. **Personalized Recommendations**
   - 3-5 actionable tips (prioritized: high/medium/low)
   - Focus on their specific situation

7. **Key Insights**
   - 3-4 bullet points summarizing financial health

---

## IMPORTANT GUIDELINES

1. **Be specific to THIS user**: Reference their actual numbers, debts, and goals
2. **Respect user preferences**: Use their chosen debt payoff strategy
3. **Be realistic**: Don't suggest cutting essentials below reasonable levels
4. **Celebrate wins**: If they're doing well, acknowledge it
5. **Actionable advice**: Every recommendation must be concrete and measurable

## EDGE CASES

1. **Expenses exceed income**: Prioritize immediate cost-cutting
2. **No debts**: Focus on investment strategy and wealth building
3. **High debt burden**: Aggressive debt payoff + minimal discretionary
4. **Negative discretionary budget**: Flag overspending, suggest rebalancing
5. **Already optimal**: Return empty suggestedChanges, congratulatory summary
6. **Zero discretionary budget**: Don't suggest reducing it further
7. **Savings target already met**: Focus on investment diversification

---

## OUTPUT FORMAT

Return a valid JSON object matching this exact schema. Do not include any markdown formatting or code blocks, just the raw JSON:

${JSON.stringify(FINANCIAL_PLAN_JSON_SCHEMA, null, 2)}`;
};

/**
 * Generate personalized financial plan using Gemini AI
 * @param data - User's onboarding data
 * @returns Comprehensive financial plan with AI recommendations
 */
export const generateFinancialPlan = async (data: OnboardingData): Promise<FinancialPlan> => {
  const prompt = buildFinancialPlanPrompt(data);
  const plan = await generateJSON<FinancialPlan>(prompt);

  return plan;
};
