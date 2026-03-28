# Plan: Extra Income, Unified Savings & Overspend Deficit Tracking

> Source PRD: smgrv123/budgetmybs#7

## Architectural Decisions

Durable decisions that apply across all phases:

- **Schema**: New `incomeTable` (standalone; month derived from `date` field, not a FK). `savingsGoalId` nullable FK added to `expensesTable`. Withdrawal flag added to savings expenses (amount stays positive, no negative amounts).
- **Income types**: `bonus`, `interest`, `cashback`, `gift`, `freelance`, `refund`, `savings_withdrawal`, `other`. The `savings_withdrawal` type is system-only — not shown in user-facing type dropdowns.
- **Budget formula**: `frivolousBudget + rolloverFromPrevious + SUM(income entries for month)`. Income is summed dynamically from `incomeTable` by month — no stored aggregate on the snapshot.
- **Rollover**: No floor. Negative rollover carries forward as a deficit. `Math.max(0, ...)` removed.
- **Savings balance**: `SUM(deposits) - SUM(withdrawals)` per `savingsGoalId` (goal-linked) or per `savingsType` (ad-hoc). Two separate balance derivations.
- **Withdrawal atomicity**: One user confirmation → two DB writes: (1) savings withdrawal expense, (2) income entry with type `savings_withdrawal`. Fully atomic.
- **Chat pattern**: All new intents follow confirm-before-commit. No auto-commit for any new action.
- **Terminology**: "Savings Goals" → "Monthly Savings" across all UI and string constants.

---

## Phase 1: Income — Data Layer

**User stories**: Foundation for stories 1–10, 33–35

### What to build

Create the complete income data layer: schema table, type enum with display labels, query module with CRUD and monthly sum function, and a TanStack Query hook. No UI in this phase — this is purely the foundational layer that phases 2 and 3 depend on.

The income query module should expose: create, get by month, delete, and a monthly sum function. The hook wraps these with proper query key invalidation following the same pattern as `useExpenses` and `useDebts`.

### Acceptance criteria

- [ ] `incomeTable` exists in schema with `id`, `amount`, `type`, `customType`, `date`, `description`, `createdAt` columns
- [ ] `IncomeType` enum and display labels follow the existing `as const` object pattern in `db/types.ts`
- [ ] `savings_withdrawal` is present in the enum but excluded from user-facing label exports
- [ ] Income query module exports: `createIncome`, `getIncomeByMonth`, `deleteIncome`, `getMonthlyIncomeSum`
- [ ] `useIncome` hook exposes queries and mutations with consistent naming (`createIncome`, `createIncomeAsync`, `isCreatingIncome`, etc.)
- [ ] `useIncome` is barrel-exported from `src/hooks/index.ts`
- [ ] All new query functions are barrel-exported from `db/queries/index.ts`
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 2: Income — Settings Screen

**User stories**: 1–10

### What to build

A new settings screen where users can log extra income (bonus, interest, cashback, gift, freelance, refund, other) and view all income entries for the current month. The screen includes a form to add new income entries (amount, type, description, date) and a list of existing entries with delete support. The `savings_withdrawal` type must not appear in the type dropdown.

Add an entry point to this screen from the existing settings navigation.

### Acceptance criteria

- [ ] Settings screen exists at `app/settings/income.tsx`
- [ ] User can add income with: amount (required), type dropdown (all types except `savings_withdrawal`), description (optional), date (defaults to today, editable)
- [ ] Income entries for the current month are listed with amount, type label, date, and description
- [ ] User can delete an income entry
- [ ] `customType` text input appears when type is `other`
- [ ] Screen is reachable from settings navigation
- [ ] All user-facing strings are in a `src/constants/income.strings.ts` file
- [ ] New screen and components follow B\* component rules and use theme constants (no hardcoded pixel values or color strings)
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 3: Budget + Rollover Integration

**User stories**: 9, 33–35

### What to build

Wire the income data layer into the monthly budget calculation. `getRemainingFrivolousBudget` now sums income entries for the month as a third component of available budget. The rollover calculation removes the `Math.max(0, ...)` floor so deficits carry forward. The budget summary visible on the dashboard and settings budget screen should reflect income as a named line item.

### Acceptance criteria

- [ ] `getRemainingFrivolousBudget` returns `totalBudget = frivolousBudget + rolloverFromPrevious + additionalIncome`
- [ ] `additionalIncome` field is included in the return value so UI can display it separately
- [ ] Rollover formula is `totalPrevBudget - prevSpent - prevSaved` with no floor — result can be negative
- [ ] A negative rollover is stored correctly on the next month's snapshot
- [ ] `getMonthlySummary` includes `additionalIncome` in its return shape
- [ ] Dashboard and budget summary UI surfaces show income contribution to budget when non-zero
- [ ] `useMonthlyBudget` hook reflects updated return shape
- [ ] Existing months with zero income are unaffected (sum returns 0, behaviour identical to before)
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 4: Monthly Savings Rename

**User stories**: 29–30

### What to build

A pure copy/terminology change with no logic modifications. Replace every instance of "Savings Goals" / "savings goal" / `savingsGoal` (in user-facing strings only — not DB column names or internal identifiers) with "Monthly Savings" across all string constant files, UI components, and screen titles. Internal code identifiers (`savingsGoalsTable`, `useSavingsGoals`, `ChatIntentEnum.ADD_SAVINGS_GOAL`) are **not** renamed in this phase — only user-visible text.

### Acceptance criteria

- [ ] All screen titles, labels, button text, and empty-state copy that previously said "Savings Goal(s)" now say "Monthly Savings"
- [ ] String constant files updated (no hardcoded strings remain in components)
- [ ] No changes to DB schema, query functions, hook names, or enum values
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 5: Savings — Schema + Balance Queries

**User stories**: Foundation for stories 13–22, 31

### What to build

Schema and query foundation for unified savings. Add a nullable `savingsGoalId` FK to `expensesTable` and an `isWithdrawal` flag (integer, default 0) to distinguish deposits from withdrawals. Both fields only apply when `isSaving = 1`.

Add balance query functions: one that returns net balance per savings goal (`SUM deposits - SUM withdrawals` for `savingsGoalId = X`) and one for ad-hoc savings grouped by `savingsType` (where `savingsGoalId` is null). Update the savings hook to expose these balances.

### Acceptance criteria

- [ ] `savingsGoalId` nullable FK exists on `expensesTable` referencing `savingsGoalsTable`
- [ ] `isWithdrawal` integer column (default 0) exists on `expensesTable`
- [ ] `getSavingsBalanceByGoal(goalId)` returns `{ deposited, withdrawn, net }` for a specific goal
- [ ] `getSavingsBalancesByAllGoals()` returns an array of `{ goalId, deposited, withdrawn, net }` for all goals with activity
- [ ] `getAdHocSavingsBalances()` returns an array of `{ savingsType, deposited, withdrawn, net }` for unlinked savings
- [ ] Existing savings data (pre-migration) is unaffected — `savingsGoalId` and `isWithdrawal` default to null/0
- [ ] Balance queries are barrel-exported from `db/queries/index.ts`
- [ ] `useSavingsGoals` hook exposes balance queries
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 6: Savings — Deposit UI

**User stories**: 13–18, 31

### What to build

Rebuild the savings deposit experience. Replace the existing one-off savings form with a unified savings transaction form that includes: amount, savings type dropdown, optional goal picker (filtered to goals matching the selected type, plus a "No goal / Ad-hoc" option), and description.

The savings summary in the settings savings screen shows each goal and each ad-hoc savings type as its own line with its net balance. Two goals of the same type (e.g., two mutual fund goals) appear as separate lines identified by goal name.

### Acceptance criteria

- [ ] Savings deposit form collects: amount, savings type, optional savings goal (filtered by type), description
- [ ] "No goal / Ad-hoc" is always available in the goal picker regardless of type
- [ ] Deposits linked to a goal correctly set `savingsGoalId` on the expense row
- [ ] Ad-hoc deposits have `savingsGoalId = null`
- [ ] Savings summary lists each goal with its net balance as a separate line
- [ ] Ad-hoc savings of a given type appear as a separate line (e.g., "Mutual Funds (ad-hoc)")
- [ ] Two goals with the same `savingsType` appear as two distinct lines identified by name
- [ ] Total saved (sum of all lines) shown at the bottom of the summary
- [ ] All user-facing strings in constants file
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 7: Savings — Withdrawal UI

**User stories**: 19–22

### What to build

Add a savings withdrawal flow. The withdrawal form lets the user select a source (a specific goal or an ad-hoc savings type), shows the available balance for that source inline, and collects an amount. On confirmation, two DB writes happen atomically: a savings withdrawal expense (`isSaving = 1`, `isWithdrawal = 1`, linked to the chosen goal or type) and an income entry with type `savings_withdrawal` that tops up the monthly budget. The user sees one confirmation, not two.

### Acceptance criteria

- [ ] Withdrawal form shows: source picker (goals + ad-hoc types with balances), available balance for selected source, amount field
- [ ] Source picker only shows sources with a net balance > 0
- [ ] Submitting a withdrawal creates both the savings withdrawal expense and the `savings_withdrawal` income entry atomically
- [ ] Monthly budget increases by the withdrawal amount (via income entry)
- [ ] Savings balance for the source decreases by the withdrawal amount
- [ ] User cannot over-withdraw (amount > available balance is blocked with a validation error)
- [ ] `savings_withdrawal` income entries do not appear in the manual income settings screen
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 8: Chat — Income Intent

**User stories**: 11–12

### What to build

Add `add_income` to `ChatIntentEnum` and `ChatResponse` discriminated union. Create `ChatIncomeData` type. Update the system prompt with an income capability block and example JSON. Build an inline income confirmation form (`inlineIncomeForm.tsx`) with amount, type dropdown, description, and date fields. Wire the new intent into the chat screen's send handler and `PendingAction` type. Add `useIncome` to the chat screen's data dependencies and pass current month's income to `ChatContext`.

### Acceptance criteria

- [ ] `ChatIntentEnum.ADD_INCOME` exists and is handled in the chat screen switch
- [ ] System prompt includes income capability block with trigger phrases and example JSON
- [ ] `ChatIncomeData` type defined in `src/types/chat.ts`
- [ ] Inline income confirmation form shows: amount, type dropdown (no `savings_withdrawal`), description, date
- [ ] Confirmed income entries are created via `useIncome` mutation
- [ ] Action status is marked completed on confirm, cancelled on dismiss
- [ ] New string constants added to `src/constants/chat.ts`
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 9: Chat — Savings Deposit Intent

**User stories**: 23–24

### What to build

Add `log_savings` to `ChatIntentEnum` and `ChatResponse`. Create `ChatSavingsData` type (amount, savingsType, optional goalId matched by AI from context). Update system prompt with savings deposit capability. The AI is given the list of active monthly savings (goals) in context and attempts to match to a goal by type. Build an inline savings confirmation form with amount, savings type, goal picker (pre-populated with AI's match, user can change), and description. Wire into chat screen.

### Acceptance criteria

- [ ] `ChatIntentEnum.LOG_SAVINGS` exists and is handled
- [ ] System prompt includes savings deposit capability with example JSON showing goal matching
- [ ] Active monthly savings (name, type, id) are included in the `ChatContext` passed to the service
- [ ] AI response includes `savingsGoalId` when it can match, null otherwise
- [ ] Inline savings form pre-selects the AI-matched goal; user can override via dropdown
- [ ] Goal dropdown is filtered to goals matching the selected savings type
- [ ] Confirmed savings are created with correct `savingsGoalId` (or null for ad-hoc)
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 10: Chat — Savings Withdrawal Intent

**User stories**: 25–27

### What to build

Add `withdraw_savings` to `ChatIntentEnum` and `ChatResponse`. Create `ChatWithdrawalData` type. Savings balances (per goal and per ad-hoc type) are added to `ChatContext` so the AI can validate the withdrawal against available funds and warn inline if over-limit. Build an inline withdrawal confirmation form showing source and available balance. On confirm, the same atomic two-write operation from Phase 7 is triggered. Wire into chat screen.

### Acceptance criteria

- [ ] `ChatIntentEnum.WITHDRAW_SAVINGS` exists and is handled
- [ ] Savings balances (goal balances + ad-hoc type balances) are included in `ChatContext`
- [ ] System prompt includes withdrawal capability with balance-aware guidance
- [ ] AI warns in its message if the requested amount exceeds available balance
- [ ] Inline withdrawal form shows source, available balance, and amount field
- [ ] Client-side validation also blocks over-withdrawal before submission
- [ ] Confirmed withdrawal triggers atomic savings expense + `savings_withdrawal` income creation
- [ ] Run `npm run typecheck` and `npm run lint` with no errors

---

## Phase 11: Chat — Monthly Savings Intent Rename

**User stories**: 32

### What to build

Rename the existing savings goal chat intents in all surfaces: `ChatIntentEnum` values (`ADD_SAVINGS_GOAL` → `ADD_MONTHLY_SAVINGS`, etc.), `ChatResponse` discriminated union arms, system prompt capability blocks, `CHAT_FORM_TITLES`, switch cases in the chat screen handler, and all related string constants. Update `UpdatableIntent` union in `inlineProfileUpdate.tsx`. No functional change — purely a naming alignment with the "Monthly Savings" terminology.

### Acceptance criteria

- [ ] `ChatIntentEnum.ADD_MONTHLY_SAVINGS`, `UPDATE_MONTHLY_SAVINGS`, `DELETE_MONTHLY_SAVINGS` replace old savings goal values
- [ ] `ChatResponse` union updated to use new intent names
- [ ] System prompt capabilities section uses "Monthly Savings" terminology
- [ ] All switch cases, form titles, field keys, and string constants updated
- [ ] `UpdatableIntent` union in inline update form reflects new intent names
- [ ] Existing monthly savings CRUD via chat continues to work end-to-end
- [ ] Run `npm run typecheck` and `npm run lint` with no errors
