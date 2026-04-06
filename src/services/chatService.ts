import { getRecentChatMessages } from '@/db';
import type { ChatMessage, Debt, FixedExpense, Income, SavingsGoal } from '@/db/schema-types';
import { ChatIntentEnum, DEBT_TYPES, FIXED_EXPENSE_TYPES, SAVINGS_TYPES, USER_INCOME_TYPES } from '@/db/types';
import { generateJSON } from '@/src/services/gemini';
import type { ChatResponse } from '@/src/types';
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

/** A single savings source (goal or ad-hoc) with its available balance, used by the AI for withdrawal validation */
export type SavingsSourceForChat = {
  id: string; // goal id (for goal sources) or savingsType string (for ad-hoc sources)
  label: string;
  availableBalance: number;
};

export type ChatContext = {
  profile: ProfileData;
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  categoryNames: string[];
  creditCards: CreditCardForChat[];
  incomeEntries?: Income[];
  savingsSources?: SavingsSourceForChat[]; // goal + ad-hoc sources with available balances
  quotedMessageContent?: string; // content of the message the user is replying to
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

const buildSystemPrompt = (ctx: ChatContext): string => {
  const { profile, fixedExpenses, debts, savingsGoals, categoryNames, creditCards, incomeEntries, savingsSources } =
    ctx;

  return `You are FinAI, a friendly Indian personal finance assistant for a budgeting app.
All monetary values are in Indian Rupees (₹). Use Indian number formatting (e.g., ₹1,50,000).

══════════════════════════════════
⚠️  EXTRACTION RULE — READ FIRST:
══════════════════════════════════
Use these three tiers to decide what data to extract:

TIER 1 — QUOTED REPLY: If a "REPLYING TO:" section appears below, the user is replying to that specific message. Combine the quoted content with the current message to extract complete intent data.

TIER 2 — FOLLOW-UP: If the user's message directly answers a question from your last turn in the conversation history (e.g. you asked "which category?" and they replied "food"), combine both to extract full data.

TIER 3 — NEW REQUEST: In all other cases treat as a fresh request. Extract data ONLY from the current user message. Do NOT carry over or infer values from earlier turns.

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

9. ADD MONTHLY SAVINGS
   Triggered by: "I want to save 10000 monthly in mutual funds", "add PPF contribution of 5000"
   Types: ${SAVINGS_TYPES.join(', ')}

10. UPDATE MONTHLY SAVINGS
    Triggered by: "update emergency fund target to 15000", "change my SIP to 12000 monthly"
    - Use existingName to identify the target (match from Monthly Savings list below)
    - Only include fields the user explicitly mentions changing
    - If user wants to rename: include both existingName (old) AND name (new)

11. DELETE MONTHLY SAVINGS
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
    Active Monthly Savings (match by name): ${savingsGoals.length > 0 ? savingsGoals.map((g) => `${g.name} | ${g.id} | ${g.type}`).join('\n    ') : 'None'}
    - If the user names a goal that matches one above, set "savingsGoalId" to its id and "savingsType" to its type
    - If the user says ad-hoc or no goal matches, set "savingsGoalId" to null and "savingsType" to a valid type from: ${SAVINGS_TYPES.join(', ')}
    - Amount must always be > 0

14. WITHDRAW SAVINGS
    Triggered by: "withdraw from savings", "take money out of emergency fund", "pull from mutual funds", "withdraw 5000 from savings"
    Available savings sources with balances: ${savingsSources && savingsSources.length > 0 ? JSON.stringify(savingsSources) : 'None'}
    - Match the user's named source to one entry in the list above. Use its "id" as "sourceId".
    - Set "sourceLabel" to the matching source's "label".
    - Set "availableBalance" to the source's "availableBalance".
    - If the source is a goal (id is a UUID-like string), set "savingsGoalId" to that id and derive "savingsType" from the source label or context.
    - If the source is ad-hoc (id matches a savingsType string like "mutual_funds"), set "savingsGoalId" to null and "savingsType" to the id value.
    - Amount must always be > 0.
    - ⚠️ If the requested amount EXCEEDS the available balance for that source, you MUST warn the user in your "message" field. Example: "That amount exceeds your available ₹X,XXX balance. Please enter a lower amount."
    - Even when the amount exceeds the balance, still return the intent so the user can adjust the amount in the confirmation form.

15. FINANCIAL PLANNING & ADVICE
    - Analyze their ACTUAL financial picture — cite real ₹ amounts from their data
    - Recommend debt payoff strategies aligned with their preference (${profile.debtPayoffPreference})
    - Factor in Indian-specific instruments (PPF, NPS, ELSS, FD rates)
    - Consider inflation (~6% for India) for long-term planning
    - Proactively suggest follow-ups

══════════════════════════════════
RESPONSE FORMAT — ALWAYS valid JSON:
══════════════════════════════════

Add expense:
{ "intent": "add_expense", "data": { "amount": 600, "category": "Food & Dining", "description": "food orders", "creditCard": "HDFC Millennia" }, "message": "Got it! Recorded ₹600 for food orders under Food & Dining on HDFC Millennia." }

Update profile:
{ "intent": "update_profile", "data": { "field": "salary", "value": 150000 }, "message": "..." }

Add fixed expense:
{ "intent": "add_fixed_expense", "data": { "name": "Netflix", "type": "subscriptions", "amount": 649 }, "message": "..." }

Update fixed expense:
{ "intent": "update_fixed_expense", "data": { "existingName": "Netflix", "amount": 799 }, "message": "..." }

Delete fixed expense:
{ "intent": "delete_fixed_expense", "data": { "existingName": "Netflix" }, "message": "Are you sure you want to delete Netflix? This cannot be undone." }

Add debt:
{ "intent": "add_debt", "data": { "name": "Car Loan", "type": "car_loan", "principal": 800000, "interestRate": 9.5, "emiAmount": 25000, "tenureMonths": 36, "remainingMonths": 36, "remaining": 800000 }, "message": "..." }

Update debt:
{ "intent": "update_debt", "data": { "existingName": "Car Loan", "emiAmount": 28000 }, "message": "..." }

Delete debt:
{ "intent": "delete_debt", "data": { "existingName": "Car Loan" }, "message": "Are you sure you want to delete Car Loan? This cannot be undone." }

Add monthly savings:
{ "intent": "add_monthly_savings", "data": { "name": "Emergency Fund", "type": "emergency_fund", "targetAmount": 100000 }, "message": "..." }

Update monthly savings:
{ "intent": "update_monthly_savings", "data": { "existingName": "Emergency Fund", "targetAmount": 150000 }, "message": "..." }

Delete monthly savings:
{ "intent": "delete_monthly_savings", "data": { "existingName": "Emergency Fund" }, "message": "Are you sure you want to delete Emergency Fund? This cannot be undone." }

Log income:
{ "intent": "add_income", "data": { "amount": 50000, "type": "bonus", "description": "Year-end bonus", "date": "2026-03-30" }, "message": "Got it! Logging ₹50,000 bonus income." }

Log savings deposit:
{ "intent": "log_savings", "data": { "amount": 5000, "savingsGoalId": "abc-123", "savingsType": "emergency_fund", "description": "Monthly top-up" }, "message": "Got it! Recording ₹5,000 deposit to Emergency Fund." }

Withdraw savings:
{ "intent": "withdraw_savings", "data": { "amount": 2000, "sourceId": "abc-123", "sourceLabel": "Emergency Fund", "availableBalance": 15000, "savingsGoalId": "abc-123", "savingsType": "emergency_fund" }, "message": "Got it! Withdrawing ₹2,000 from Emergency Fund. Please confirm below." }

General / advice:
{ "intent": "general", "message": "..." }

══════════════════════════════════
CURRENT USER CONTEXT:
══════════════════════════════════
- Today: ${dayjs().format('YYYY-MM-DD')} | salary: ₹${profile.salary.toLocaleString('en-IN')} | savings target: ₹${profile.monthlySavingsTarget.toLocaleString('en-IN')} | fun budget: ₹${profile.frivolousBudget.toLocaleString('en-IN')} | debt preference: ${profile.debtPayoffPreference}
- Fixed Expenses: ${fixedExpenses.length > 0 ? fixedExpenses.map((e) => e.name).join(', ') : 'None'}
- Active Debts: ${debts.length > 0 ? debts.map((d) => `${d.name} | ${d.remaining} | ${d.emiAmount}`).join('\n  ') : 'None'}
- Savings Goals: ${savingsGoals.length > 0 ? savingsGoals.map((g) => `${g.name} | ${g.id} | ${g.type}`).join('\n  ') : 'None'}
- Expense Categories: ${categoryNames.join(', ')}
- Credit Cards: ${creditCards.length > 0 ? creditCards.map((c) => `${c.nickname} | ${c.bank} | ${c.provider}`).join('\n  ') : 'None'}
- This Month's Income: ${incomeEntries && incomeEntries.length > 0 ? incomeEntries.map((e) => `${e.id} | ${e.type} | ${e.amount}`).join('\n  ') : 'None'}`;
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

const chatWithdrawalDataSchema = z.object({
  amount: z.number().positive(),
  sourceId: z.string().min(1),
  sourceLabel: z.string().min(1),
  availableBalance: z.number().min(0),
  savingsGoalId: z.string().nullable(),
  savingsType: z.enum(SAVINGS_TYPES as [string, ...string[]]).nullable(),
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
  if (raw.intent === ChatIntentEnum.WITHDRAW_SAVINGS) {
    const parsed = chatWithdrawalDataSchema.safeParse(raw.data);
    if (parsed.success) {
      return { ...raw, data: parsed.data } as ChatResponse;
    }
    // Log the violation but still return so the caller can show the form with a safe fallback
    console.warn('[chatService] withdraw_savings data failed schema validation:', parsed.error.flatten());
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

  const quotedBlock = context.quotedMessageContent
    ? `\n\n══════════════════════════════════\nREPLYING TO:\n══════════════════════════════════\n${context.quotedMessageContent}`
    : '';

  const fullPrompt = `${systemPrompt}${historyBlock}${quotedBlock}

══════════════════════════════════
CURRENT USER MESSAGE:
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
