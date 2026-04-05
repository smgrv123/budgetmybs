# Plan: Chat Feature Refactor

> Source PRD: [GitHub Issue #31](https://github.com/smgrv123/budgetmybs/issues/31) — Chat Feature Refactor: Intent Registry, Prompt Optimization & CRUD Completeness

## Architectural decisions

Durable decisions that apply across all phases:

- **Data flow**: Components -> Hooks (TanStack Query) -> DB Queries -> SQLite. Components never import from `db/` directly.
- **State**: Query data via TanStack Query, component-scoped UI state via `useState`. No new Zustand stores.
- **AI integration**: Single-pass, stateless. Full system prompt + last 15 messages as history text every call. No persistent AI sessions.
- **Intent registry**: Single source of truth for all intent behavior. Lives in the chat domain. Every intent is a declarative config object — no per-intent logic outside the registry.
- **Generic form**: One component renders any intent's form from registry config. Field types: `text`, `number`, `picker`, `date`, `static`. Delete intents use `formType: 'deleteConfirm'`.
- **Form data providers**: `useFormOptionSources()` and `useMutationMap()` call all hooks unconditionally. Registry references by string key. TanStack Query deduplication makes this free.
- **Mutations**: Registry defines an ordered `mutations` array per intent. Generic handler iterates sequentially, bailing on first failure. Steps are data-independent (no return value passing).
- **Messages**: Single message per action. Rotating pool of 10-12 success/failure variants per intent category. On cancel, show cancellation message.
- **Prompt format**: Terse pipe-delimited context (not JSON). One example response per intent. Three-tier extraction rule for multi-turn conversations.
- **Pagination**: Offset/limit on chat query. Infinite scroll via FlatList `onEndReached` (inverted list).
- **Existing DB layer**: All CRUD queries and mutation hooks already exist for expenses, income, credit cards, savings goals, debts, fixed expenses, and profile. No new DB layer work needed.

---

## Phase 1: Intent Registry + Generic Form (Foundation)

**User stories**: 16, 17, 18

### What to build

Build the intent registry module and generic inline form component. The registry defines each intent as a declarative config with: fields, mutations array, transformData, messages, invalidations, validate, buttonVariant, title, and formType.

Build the generic form that reads registry config and renders the appropriate field types (text, number, picker, date, static display). Build `useFormOptionSources()` and `useMutationMap()` hooks that call all data/mutation hooks unconditionally and expose them via string-keyed maps.

Build the generic `handleConfirm` handler (as a hook) that reads registry config, transforms data, executes mutations in order, handles success/failure messaging, updates action status, and invalidates queries.

Migrate **3 existing intents** to prove each form type works:

- `ADD_EXPENSE` — picker fields (category, credit card), text, number
- `ADD_INCOME` — date field, conditional field (customType when type === OTHER)
- `DELETE_FIXED_EXPENSE` — deleteConfirm form type

Keep old form components for un-migrated intents. The chat screen should support both old and new paths during migration — registry-based intents use the generic form, others fall through to existing components.

### Acceptance criteria

- [ ] Intent registry module exists with config entries for ADD_EXPENSE, ADD_INCOME, DELETE_FIXED_EXPENSE
- [ ] Generic inline form renders correctly for all 3 migrated intents (text, number, picker, date, conditional fields, delete confirmation)
- [ ] `useFormOptionSources()` provides categories, credit cards, and other option sources by string key
- [ ] `useMutationMap()` provides all mutation hooks by string key
- [ ] Generic `handleConfirm` hook executes mutations, handles success/failure, updates action status, invalidates queries
- [ ] Migrated intents work end-to-end: user message -> AI response -> form rendered -> user confirms -> mutation executed -> queries refreshed
- [ ] Un-migrated intents still work via old form components (no regressions)
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 2: Migrate Remaining Existing Intents

**User stories**: 16, 17, 18

### What to build

Migrate all remaining existing intents to the registry:

- `UPDATE_PROFILE`
- `ADD_FIXED_EXPENSE`, `UPDATE_FIXED_EXPENSE`
- `ADD_DEBT`, `UPDATE_DEBT`, `DELETE_DEBT`
- `ADD_MONTHLY_SAVINGS`, `UPDATE_MONTHLY_SAVINGS`, `DELETE_MONTHLY_SAVINGS`
- `LOG_SAVINGS`
- `WITHDRAW_SAVINGS` (multi-step mutation: createExpense + createIncome)

Delete all old inline form components (InlineExpenseForm, InlineIncomeForm, InlineSavingsForm, InlineWithdrawalForm, InlineProfileUpdate, InlineDeleteConfirm). Update barrel exports.

Remove all per-intent handler functions and switch statements from chat.tsx. The chat screen should now only orchestrate — message list, input, and delegating to the generic form/confirm handler.

### Acceptance criteria

- [ ] All 14 existing intents (excluding GENERAL) are defined in the intent registry
- [ ] All old inline form components are deleted
- [ ] Barrel exports updated — only ChatBubble, ChatHeader, ChatInput, and the new GenericInlineForm exported
- [ ] Multi-step mutation works for WITHDRAW_SAVINGS (createExpense then createIncome, bail on first failure)
- [ ] Update intents correctly resolve entity IDs via context lookups (fixedExpenses.find, debts.find, savingsGoals.find)
- [ ] UPDATE_PROFILE correctly merges with existing profile data
- [ ] chat.tsx reduced significantly — no per-intent handlers or switch statements remain
- [ ] All intents work end-to-end with no regressions
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 3: Message Flow — Single Message Per Action

**User stories**: 9, 10, 15

### What to build

Replace the double-message pattern (AI response + success confirmation) with a single message per action.

Build a rotating message pool — 10-12 success and failure message variants per intent category (expense, income, savings, etc.) to maintain conversational freshness.

Change the confirm/cancel flow:

- On confirm: remove or replace the AI preview message, save a success message from the rotating pool
- On cancel: remove or replace the AI preview message, save a cancellation message

Update the generic confirm handler and cancel handler to implement this flow.

### Acceptance criteria

- [ ] Only one assistant message appears per action (not two)
- [ ] Success messages rotate through a pool of 10-12 variants per intent category
- [ ] Failure messages rotate through a pool of variants
- [ ] Cancel shows a cancellation message (not a success message)
- [ ] Message pool strings live in constants (following existing pattern in chat.strings or chat.ts)
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 4: Prompt Optimization

**User stories**: 14, 19

### What to build

Refactor the system prompt builder in chatService to reduce token usage:

**Context format**: Switch all entity dumps from JSON to terse pipe-delimited format:

- Fixed expenses -> names only
- Debts -> names only
- Savings goals -> name | id | type
- Credit cards -> nickname | bank | provider
- Income entries -> id | type | amount
- Categories -> comma-separated names (already slim, no change)
- Savings sources -> no change (already needed for withdrawal validation)

**Examples**: Reduce to one example JSON response per intent (currently 2-3 for some).

**Profile**: Terse single-line format instead of bullet points with labels.

Verify AI response quality is maintained after prompt changes — the AI should still correctly classify intents and extract data.

### Acceptance criteria

- [ ] All context data uses terse pipe-delimited format (no JSON dumps)
- [ ] One example JSON response per intent in the prompt
- [ ] Profile data in compact single-line format
- [ ] AI correctly classifies intents and extracts data with the optimized prompt (manual verification)
- [ ] All existing intents work end-to-end with the new prompt format
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 5: Conversational Extraction Rule + Quoted Messages

**User stories**: 12, 13

### What to build

Replace the strict "ONLY extract data from the CURRENT user message" rule with a three-tier extraction rule:

1. If the user is replying to a quoted message -> combine current message with quoted message context
2. If the user's message is a follow-up to the AI's most recent question -> combine with that conversation thread
3. Otherwise -> treat as a new request, extract only from current message

Update the prompt builder to include quoted message content when present. When `quotedMessageId` is set on the user message, look up the quoted message's content and include it in the prompt under a "REPLYING TO:" section.

Update the `sendChatMessage` function signature or the chat screen to pass the quoted message content through to the prompt builder.

### Acceptance criteria

- [ ] Three-tier extraction rule is in the system prompt, replacing the strict single-message rule
- [ ] Quoted message content is passed to the AI when the user replies to a specific message
- [ ] Multi-turn flows work: user gives partial info -> AI asks for more -> user provides it -> AI combines everything into the correct intent
- [ ] Quoting an old message gives the AI context from that specific message
- [ ] New requests (no quote, no follow-up) still extract only from current message (no hallucinations from old history)
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 6: New CRUD Intents — Expenses & Income

**User stories**: 1, 2, 3, 4, 5

### What to build

Add new intents to the registry: `UPDATE_EXPENSE`, `DELETE_EXPENSE`, `UPDATE_INCOME`, `DELETE_INCOME`.

Add new ChatIntentEnum values and ChatResponse union members for these intents. Define their data types (need expense/income ID for targeting).

Update the system prompt to:

- Include recent expenses (current month) with IDs in terse format: `id | amount | category | description | date`
- Include income entries with IDs in terse format: `id | type | amount`
- Add capability descriptions, trigger examples, and one response example per new intent
- Describe the disambiguation flow: if multiple matches, respond as GENERAL listing candidates for user to clarify

Add registry entries for each new intent with appropriate fields, mutations (useUpdateExpense, useRemoveExpense, useUpdateIncome, useRemoveIncome), transformData, and messages.

### Acceptance criteria

- [ ] ChatIntentEnum includes UPDATE_EXPENSE, DELETE_EXPENSE, UPDATE_INCOME, DELETE_INCOME
- [ ] ChatResponse type covers all new intents with appropriate data types
- [ ] Registry entries exist for all 4 new intents
- [ ] Recent expenses (current month) included in prompt context with IDs
- [ ] Income entries included in prompt context with IDs
- [ ] AI correctly identifies update/delete expense requests and returns the right intent with expense ID
- [ ] AI correctly identifies update/delete income requests and returns the right intent with income ID
- [ ] Disambiguation works: AI asks for clarification when multiple matches exist
- [ ] Update/delete mutations execute correctly through the generic handler
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 7: New CRUD Intents — Credit Cards

**User stories**: 6, 7, 8

### What to build

Add new intents to the registry: `ADD_CREDIT_CARD`, `UPDATE_CREDIT_CARD`, `DELETE_CREDIT_CARD`.

Add new ChatIntentEnum values and ChatResponse union members. Define data types — ADD needs all credit card fields (nickname, bank, provider, last4, creditLimit, statementDayOfMonth, paymentBufferDays), UPDATE needs existingName (nickname) + changed fields, DELETE needs existingName.

For ADD_CREDIT_CARD: the AI extracts what it can from natural language, and the generic form shows all fields with AI-extracted values pre-filled and blanks for missing values. User fills gaps before confirming.

Update the system prompt with capability descriptions, trigger examples, and one response example per new intent.

Add registry entries with fields, mutations (useCreateCreditCard, useUpdateCreditCard, useRemoveCreditCard), transformData, and messages.

### Acceptance criteria

- [ ] ChatIntentEnum includes ADD_CREDIT_CARD, UPDATE_CREDIT_CARD, DELETE_CREDIT_CARD
- [ ] ChatResponse type covers all new intents with appropriate data types
- [ ] Registry entries exist for all 3 new intent
- [ ] ADD_CREDIT_CARD form shows all credit card fields, pre-filled where AI extracted values, blank otherwise
- [ ] UPDATE_CREDIT_CARD correctly identifies card by nickname and updates specified fields
- [ ] DELETE_CREDIT_CARD shows delete confirmation with card nickname
- [ ] System prompt includes credit card CRUD capabilities and examples
- [ ] All mutations execute correctly through the generic handler
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)

---

## Phase 8: Infinite Scroll Pagination

**User stories**: 11

### What to build

Add offset/limit pagination to the chat message query. The DB query `getChatMessages` already supports limit and offset parameters — wire these up through the hook layer with TanStack Query's infinite query pattern (`useInfiniteQuery`).

Update the FlatList to trigger loading the next page when the user scrolls to the top (since the list is inverted, this uses `onEndReached`). Show a loading indicator while fetching older messages.

Remove the hard cap of 50 messages. Users can scroll back indefinitely.

### Acceptance criteria

- [ ] Chat messages load in pages (e.g., 30 messages per page)
- [ ] Scrolling to the top of the message list triggers loading the next page
- [ ] Loading indicator shown while fetching older messages
- [ ] No hard cap on how far back users can scroll
- [ ] New messages still appear at the bottom in real-time
- [ ] Scroll position maintained when older messages load (no jump)
- [ ] No lint errors (`pnpm run lint`)
- [ ] No type errors (`pnpm run typecheck`)
