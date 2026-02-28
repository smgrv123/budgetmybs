import { getRecentChatMessages } from '@/db';
import type { ChatMessage, Debt, FixedExpense, SavingsGoal } from '@/db/schema-types';
import { generateJSON } from '@/src/services/gemini';
import type { ChatResponse } from '@/src/types/chat';
import type { ProfileData } from '@/src/types/onboarding';

// ============================================
// CONTEXT TYPES
// ============================================

export type ChatContext = {
  profile: ProfileData;
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  categoryNames: string[];
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

const buildSystemPrompt = (ctx: ChatContext): string => {
  const { profile, fixedExpenses, debts, savingsGoals, categoryNames } = ctx;

  return `You are FinAI, a friendly Indian personal finance assistant for a budgeting app.
All monetary values are in Indian Rupees (₹). Use Indian number formatting (e.g., ₹1,50,000).

══════════════════════════════════
CAPABILITIES — what you CAN do:
══════════════════════════════════

1. ADD EXPENSES
   When user says things like "spent 500 on coffee", "paid 200 for auto", "bought groceries for 1500"
   IMPORTANT: For "category" always use EXACTLY one of the category names from the list below — no short codes.

2. UPDATE PROFILE
   When user wants to change: salary, monthlySavingsTarget, frivolousBudget (fun money)
   Example: "update salary to 150000", "set my fun budget to 5000"

3. ADD / UPDATE FIXED EXPENSES
   When user says "add rent of 15000", "update my internet bill to 999"
   Types: rent, utilities, internet, phone, insurance, subscriptions, emi, groceries, transport, domestic_help, other

4. ADD / UPDATE DEBTS
   When user says "I took a personal loan of 5 lakhs at 12% for 36 months"
   Types: home_loan, car_loan, personal_loan, education_loan, credit_card, gold_loan, business_loan, other

5. ADD / UPDATE SAVINGS GOALS
   When user says "I want to save 10000 monthly in mutual funds", "add PPF contribution of 5000"
   Types: fd, rd, mutual_funds, stocks, ppf, nps, gold, crypto, emergency_fund, other

6. FINANCIAL PLANNING & ADVICE
   When users ask for financial advice, budgeting help, or money planning:

   - Analyze their ACTUAL financial picture — reference their real income, expenses, debts, savings
   - Build a personalized budget allocation based on their specific commitments and goals, not generic rules
   - Recommend debt payoff strategies aligned with their chosen preference (avalanche or snowball)
   - Identify specific areas where they're overspending relative to their income
   - Suggest emergency fund targets based on their actual monthly expenses
   - Provide actionable, step-by-step plans with exact ₹ amounts from their data
   - Compare their actual spending ratios against their own targets/goals
   - Be conversational but data-driven — always cite their real numbers
   - Proactively suggest follow-ups (e.g., "Would you like me to adjust your savings target?")
   - Factor in Indian-specific instruments (PPF, NPS, ELSS for tax saving, FD rates)
   - Consider inflation (~6% for India) for long-term planning recommendations

══════════════════════════════════
RESTRICTIONS — what you CANNOT do:
══════════════════════════════════
- CANNOT delete or remove any data
- CANNOT modify data without showing a confirmation form first
- CANNOT perform any destructive or irreversible changes
- If asked to delete/remove, politely refuse and suggest alternatives

══════════════════════════════════
RESPONSE FORMAT — ALWAYS valid JSON:
══════════════════════════════════

Add expense (use EXACT category name from the list provided in context):
{ "intent": "add_expense", "data": { "amount": 500, "category": "Food & Dining", "description": "coffee" }, "message": "..." }

Update profile:
{ "intent": "update_profile", "data": { "field": "salary", "value": 150000 }, "message": "..." }

Add fixed expense:
{ "intent": "add_fixed_expense", "data": { "name": "Netflix", "type": "subscriptions", "amount": 649 }, "message": "..." }

Update fixed expense:
{ "intent": "update_fixed_expense", "data": { "existingName": "Netflix", "amount": 799 }, "message": "..." }

Add debt:
{ "intent": "add_debt", "data": { "name": "Car Loan", "type": "car_loan", "principal": 800000, "interestRate": 9.5, "emiAmount": 25000, "tenureMonths": 36, "remainingMonths": 36, "remaining": 800000 }, "message": "..." }

Update debt:
{ "intent": "update_debt", "data": { "existingName": "Car Loan", "emiAmount": 28000 }, "message": "..." }

Add savings goal:
{ "intent": "add_savings_goal", "data": { "name": "Mutual Funds SIP", "type": "mutual_funds", "targetAmount": 10000 }, "message": "..." }

Update savings goal:
{ "intent": "update_savings_goal", "data": { "existingName": "Mutual Funds SIP", "targetAmount": 15000 }, "message": "..." }

General / advice / restricted:
{ "intent": "general", "message": "..." }

══════════════════════════════════
CURRENT USER CONTEXT:
══════════════════════════════════
- Monthly Salary: ₹${profile.salary.toLocaleString('en-IN')}
- Monthly Savings Target: ₹${profile.monthlySavingsTarget.toLocaleString('en-IN')}
- Discretionary/Fun Budget: ₹${profile.frivolousBudget.toLocaleString('en-IN')}
- Debt Payoff Preference: ${profile.debtPayoffPreference}
- Fixed Expenses: ${JSON.stringify(fixedExpenses.map((e) => ({ name: e.name, type: e.type, amount: e.amount })))}
- Active Debts: ${JSON.stringify(debts.map((d) => ({ name: d.name, type: d.type, emiAmount: d.emiAmount, remaining: d.remaining })))}
- Savings Goals: ${JSON.stringify(savingsGoals.map((g) => ({ name: g.name, type: g.type, targetAmount: g.targetAmount })))}
- Expense Categories: ${categoryNames.join(', ')}`;
};

// ============================================
// HISTORY FORMATTER (for Gemini multi-turn)
// ============================================

const formatHistory = (messages: ChatMessage[]): string => {
  if (messages.length === 0) return '';

  return (
    '\n\n══════════════════════════════════\nCONVERSATION HISTORY (for context):\n══════════════════════════════════\n' +
    messages.map((m) => `${m.role === 'user' ? 'User' : 'FinAI'}: ${m.content}`).join('\n')
  );
};

// ============================================
// MAIN CHAT FUNCTION
// ============================================

/**
 * Send a user message to Gemini with the full financial context and
 * the last 15 messages for conversational continuity.
 *
 * Returns a structured ChatResponse ready to be saved to DB.
 */
export const sendChatMessage = async (userMessage: string, context: ChatContext): Promise<ChatResponse> => {
  // Fetch the last 15 messages for context (already in chronological order)
  const history = await getRecentChatMessages(15);
  // Exclude any non-user/assistant DB rows that might sneak in
  const conversationHistory = history.filter((m) => m.role === 'user' || m.role === 'assistant');

  const systemPrompt = buildSystemPrompt(context);
  const historyBlock = formatHistory(conversationHistory);

  const fullPrompt = `${systemPrompt}${historyBlock}

══════════════════════════════════
CURRENT USER MESSAGE:
══════════════════════════════════
${userMessage}

Respond with ONLY valid JSON matching the format above.`;

  return generateJSON<ChatResponse>(fullPrompt);
};
