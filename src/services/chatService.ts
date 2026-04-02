import { getRecentChatMessages } from '@/db';
import type { ChatMessage, Debt, FixedExpense, Income, SavingsGoal } from '@/db/schema-types';
import { ChatIntentEnum, DEBT_TYPES, FIXED_EXPENSE_TYPES, SAVINGS_TYPES, USER_INCOME_TYPES } from '@/db/types';
import { generateJSON } from '@/src/services/gemini';
import type { ChatResponse } from '@/src/types/chat';
import type { ProfileData } from '@/src/types/onboarding';
import { ensureNetworkAvailable } from '@/src/utils/network';
import dayjs from 'dayjs';
import { z } from 'zod';

// ============================================
// CONTEXT TYPES
// ============================================

export type CreditCardForChat = {
  nickname: string;
  bank: string;
  provider: string;
  last4: string;
};

export type ChatContext = {
  profile: ProfileData;
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  categoryNames: string[];
  creditCards: CreditCardForChat[];
  incomeEntries?: Income[];
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

const buildSystemPrompt = (ctx: ChatContext): string => {
  const { profile, fixedExpenses, debts, savingsGoals, categoryNames, creditCards, incomeEntries } = ctx;

  return `You are FinAI, a friendly Indian personal finance assistant for a budgeting app.
All monetary values are in Indian Rupees (₹). Use Indian number formatting (e.g., ₹1,50,000).

══════════════════════════════════
⚠️  CRITICAL EXTRACTION RULE — READ FIRST:
══════════════════════════════════
ONLY extract data from the CURRENT user message below.
Do NOT reuse, carry over, or infer values from previous messages in the conversation history.
If a value is not explicitly stated in the current message, do NOT include that field in data.

══════════════════════════════════
CAPABILITIES — what you CAN do:
══════════════════════════════════

1. ADD EXPENSES
   Triggered by: "spent 500 on coffee", "paid 200 for auto", "bought groceries for 1500"
   - For "category" use EXACTLY one name from the Expense Categories list below. No short codes, no made-up names.
   - For "creditCard" use EXACTLY the nickname from the Credit Cards list below when the user mentions a card. Return null if no card is mentioned or if you cannot confidently match one.

2. UPDATE PROFILE
   Fields: salary, monthlySavingsTarget, frivolousBudget
   Triggered by: "update salary to 150000", "set my fun budget to 5000"

3. ADD FIXED EXPENSES
   Triggered by: "add rent of 15000", "add Netflix subscription for 649"
   Types: ${FIXED_EXPENSE_TYPES.join(', ')}

4. UPDATE FIXED EXPENSES
   Triggered by: "change my Netflix to 799", "update internet bill to 999"
   - Use existingName to identify the target (match from Fixed Expenses list below)
   - Only include fields the user explicitly mentions changing
   - If user wants to rename: include both existingName (old) AND name (new)

5. DELETE FIXED EXPENSES
   Triggered by: "remove Netflix", "delete my internet subscription"
   - Confirm deletion in your message before returning this intent
   - Use existingName to identify the target

6. ADD DEBTS
   Triggered by: "I took a personal loan of 5 lakhs at 12% for 36 months"
   Types: ${DEBT_TYPES.join(', ')}

7. UPDATE DEBTS
   Triggered by: "update my car loan EMI to 28000", "change car loan interest rate to 10%"
   - Use existingName to identify the target (match from Active Debts list below)
   - Only include fields the user explicitly mentions changing
   - If user wants to rename: include both existingName (old) AND name (new)

8. DELETE DEBTS
   Triggered by: "I've paid off my car loan", "remove my personal loan"
   - Confirm deletion in your message before returning this intent
   - Use existingName to identify the target

9. ADD SAVINGS GOALS
   Triggered by: "I want to save 10000 monthly in mutual funds", "add PPF contribution of 5000"
   Types: ${SAVINGS_TYPES.join(', ')}

10. UPDATE SAVINGS GOALS
    Triggered by: "update emergency fund target to 15000", "change my SIP to 12000 monthly"
    - Use existingName to identify the target (match from Savings Goals list below)
    - Only include fields the user explicitly mentions changing
    - If user wants to rename: include both existingName (old) AND name (new)

11. DELETE SAVINGS GOALS
    Triggered by: "remove my emergency fund goal", "delete the PPF goal"
    - Confirm deletion in your message before returning this intent
    - Use existingName to identify the target

12. LOG INCOME
    Triggered by: "I got a bonus", "received freelance payment", "log income", "got cashback", "received gift money", "got a refund", "earned interest"
    Types (use exact value): ${USER_INCOME_TYPES.join(', ')}
    - "date" must be in YYYY-MM-DD format; use today's date if not mentioned
    - "customType" is required only when type is "other"
    - Do NOT use "savings_withdrawal" — that type is system-only

13. LOG SAVINGS DEPOSIT
    Triggered by: "saved 5000 to emergency fund", "put money into savings", "log savings deposit", "deposited to mutual funds", "added to my SIP"
    Active Monthly Savings (match by name): ${savingsGoals.length > 0 ? JSON.stringify(savingsGoals.map((g) => ({ id: g.id, name: g.name, type: g.type }))) : 'None'}
    - If the user names a goal that matches one above, set "savingsGoalId" to its id and "savingsType" to its type
    - If the user says ad-hoc or no goal matches, set "savingsGoalId" to null and "savingsType" to a valid type from: ${SAVINGS_TYPES.join(', ')}
    - Amount must always be > 0

14. FINANCIAL PLANNING & ADVICE
    - Analyze their ACTUAL financial picture — cite real ₹ amounts from their data
    - Recommend debt payoff strategies aligned with their preference (${profile.debtPayoffPreference})
    - Factor in Indian-specific instruments (PPF, NPS, ELSS, FD rates)
    - Consider inflation (~6% for India) for long-term planning
    - Proactively suggest follow-ups

══════════════════════════════════
RESPONSE FORMAT — ALWAYS valid JSON:
══════════════════════════════════

Add expense (category MUST be exact name from list; creditCard MUST be exact nickname from list or null):
{ "intent": "add_expense", "data": { "amount": 500, "category": "Food & Dining", "description": "coffee", "creditCard": null }, "message": "Got it! Recorded ₹500 for coffee under Food & Dining." }
{ "intent": "add_expense", "data": { "amount": 600, "category": "Food & Dining", "description": "food orders", "creditCard": "HDFC Millennia" }, "message": "Got it! Recorded ₹600 for food orders under Food & Dining on HDFC Millennia." }

Update profile:
{ "intent": "update_profile", "data": { "field": "salary", "value": 150000 }, "message": "..." }

Add fixed expense:
{ "intent": "add_fixed_expense", "data": { "name": "Netflix", "type": "subscriptions", "amount": 649 }, "message": "..." }

Update fixed expense (only changed fields + existingName):
{ "intent": "update_fixed_expense", "data": { "existingName": "Netflix", "amount": 799 }, "message": "..." }

Rename + update fixed expense:
{ "intent": "update_fixed_expense", "data": { "existingName": "Netflix", "name": "Disney+", "amount": 899 }, "message": "..." }

Delete fixed expense:
{ "intent": "delete_fixed_expense", "data": { "existingName": "Netflix" }, "message": "Are you sure you want to delete Netflix? This cannot be undone." }

Add debt:
{ "intent": "add_debt", "data": { "name": "Car Loan", "type": "car_loan", "principal": 800000, "interestRate": 9.5, "emiAmount": 25000, "tenureMonths": 36, "remainingMonths": 36, "remaining": 800000 }, "message": "..." }

Update debt (only changed fields + existingName):
{ "intent": "update_debt", "data": { "existingName": "Car Loan", "emiAmount": 28000 }, "message": "..." }

Delete debt:
{ "intent": "delete_debt", "data": { "existingName": "Car Loan" }, "message": "Are you sure you want to delete Car Loan? This cannot be undone." }

Add savings goal:
{ "intent": "add_savings_goal", "data": { "name": "Emergency Fund", "type": "emergency_fund", "targetAmount": 100000 }, "message": "..." }

Update savings goal (only changed fields + existingName):
{ "intent": "update_savings_goal", "data": { "existingName": "Emergency Fund", "targetAmount": 150000 }, "message": "..." }

Delete savings goal:
{ "intent": "delete_savings_goal", "data": { "existingName": "Emergency Fund" }, "message": "Are you sure you want to delete Emergency Fund? This cannot be undone." }

Log income:
{ "intent": "add_income", "data": { "amount": 50000, "type": "bonus", "description": "Year-end bonus", "date": "2026-03-30" }, "message": "Got it! Logging ₹50,000 bonus income for today." }
{ "intent": "add_income", "data": { "amount": 15000, "type": "freelance", "description": "Website project", "date": "2026-03-28" }, "message": "Got it! Recording ₹15,000 freelance payment." }
{ "intent": "add_income", "data": { "amount": 2000, "type": "other", "customType": "Dividend", "description": "Quarterly dividend", "date": "2026-03-30" }, "message": "Got it! Logging ₹2,000 dividend income." }

Log savings deposit (goal-linked — savingsGoalId matched from active goals):
{ "intent": "log_savings", "data": { "amount": 5000, "savingsGoalId": "abc-123", "savingsType": "emergency_fund", "description": "Monthly top-up" }, "message": "Got it! Recording ₹5,000 deposit to Emergency Fund." }

Log savings deposit (ad-hoc — no goal matched or user said ad-hoc):
{ "intent": "log_savings", "data": { "amount": 3000, "savingsGoalId": null, "savingsType": "mutual_funds", "description": "SIP" }, "message": "Got it! Recording ₹3,000 ad-hoc savings deposit under Mutual Funds." }

General / advice:
{ "intent": "general", "message": "..." }

══════════════════════════════════
CURRENT USER CONTEXT:
══════════════════════════════════
- Today's date: ${dayjs().format('YYYY-MM-DD')} (use this exact value for "today" in any date field)
- Monthly Salary: ₹${profile.salary.toLocaleString('en-IN')}
- Monthly Savings Target: ₹${profile.monthlySavingsTarget.toLocaleString('en-IN')}
- Discretionary/Fun Budget: ₹${profile.frivolousBudget.toLocaleString('en-IN')}
- Debt Payoff Preference: ${profile.debtPayoffPreference}
- Fixed Expenses: ${JSON.stringify(fixedExpenses.map((e) => ({ name: e.name, type: e.type, amount: e.amount })))}
- Active Debts: ${JSON.stringify(debts.map((d) => ({ name: d.name, type: d.type, emiAmount: d.emiAmount, remaining: d.remaining })))}
- Savings Goals: ${JSON.stringify(savingsGoals.map((g) => ({ name: g.name, type: g.type, targetAmount: g.targetAmount })))}
- Expense Categories: ${categoryNames.join(', ')}
- Credit Cards: ${creditCards.length > 0 ? JSON.stringify(creditCards) : 'None'}
- This Month's Income Entries: ${incomeEntries && incomeEntries.length > 0 ? JSON.stringify(incomeEntries.map((e) => ({ type: e.type, amount: e.amount, date: e.date, description: e.description }))) : 'None'}`;
};

// ============================================
// HISTORY FORMATTER (for Gemini multi-turn)
// ============================================

const formatHistory = (messages: ChatMessage[]): string => {
  if (messages.length === 0) return '';

  return (
    '\n\n══════════════════════════════════\nCONVERSATION HISTORY (for context only — do NOT extract data from here):\n══════════════════════════════════\n' +
    messages.map((m) => `${m.role === 'user' ? 'User' : 'FinAI'}: ${m.content}`).join('\n')
  );
};

// ============================================
// RESPONSE VALIDATION
// ============================================

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const chatIncomeDateSchema = z
  .string()
  .transform((val) => (ISO_DATE_RE.test(val) ? val : dayjs().format('YYYY-MM-DD')));

const chatIncomeDataSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(USER_INCOME_TYPES as [string, ...string[]]),
  customType: z.string().optional(),
  description: z.string().optional(),
  date: chatIncomeDateSchema,
});

const chatSavingsDataSchema = z.object({
  amount: z.number().positive(),
  savingsGoalId: z.string().nullable(),
  savingsType: z.enum(SAVINGS_TYPES as [string, ...string[]]),
  description: z.string().optional(),
});

/**
 * Post-process the raw AI response. Validates intent-specific data through
 * Zod schemas and normalises fields (e.g. bad date strings → today's YYYY-MM-DD).
 */
const normaliseResponse = (raw: ChatResponse): ChatResponse => {
  if (raw.intent === ChatIntentEnum.ADD_INCOME) {
    const parsed = chatIncomeDataSchema.safeParse(raw.data);
    if (parsed.success) {
      return { ...raw, data: parsed.data } as ChatResponse;
    }
    // Log the violation but still return so the caller can show the form with a safe fallback
    console.warn('[chatService] add_income data failed schema validation:', parsed.error.flatten());
  }
  if (raw.intent === ChatIntentEnum.LOG_SAVINGS) {
    const parsed = chatSavingsDataSchema.safeParse(raw.data);
    if (parsed.success) {
      return { ...raw, data: parsed.data } as ChatResponse;
    }
    // Log the violation but still return so the caller can show the form with a safe fallback
    console.warn('[chatService] log_savings data failed schema validation:', parsed.error.flatten());
  }
  return raw;
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
  await ensureNetworkAvailable();

  // Fetch the last 15 messages for context (already in chronological order)
  const history = await getRecentChatMessages(15);
  // Exclude any non-user/assistant DB rows that might sneak in
  const conversationHistory = history.filter((m) => m.role === 'user' || m.role === 'assistant');

  const systemPrompt = buildSystemPrompt(context);
  const historyBlock = formatHistory(conversationHistory);

  const fullPrompt = `${systemPrompt}${historyBlock}

══════════════════════════════════
CURRENT USER MESSAGE (extract data ONLY from this):
══════════════════════════════════
${userMessage}

Respond with ONLY valid JSON matching the format above.`;

  try {
    const raw = await generateJSON<ChatResponse>(fullPrompt);
    return normaliseResponse(raw);
  } catch (error) {
    // If the request failed due to the network dropping mid-call,
    // re-check connectivity so callers can show a specific offline error.
    await ensureNetworkAvailable();
    throw error;
  }
};
