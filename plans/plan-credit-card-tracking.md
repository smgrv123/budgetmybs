# Plan: Credit Card Expense Tracking

> Source PRD: `plans/prd-credit-card-tracking.md`

## Architectural Decisions

Durable decisions that apply across all phases:

- **Routes**: `/settings/credit-cards` (card management), `/credit-cards/[id]` (card detail screen)
- **Schema**:
  - `creditCardsTable` — gains `monthlyInterestRate` (real, nullable) in Phase 6
  - `creditCardExpensesTable` — links purchases to statement cycles (`statementMonth`, `statementEndDate`, `dueDate`)
  - `creditCardPaymentsTable` — gains `statementMonth` (text, nullable) in Phase 4 for FIFO cycle attribution
  - `expensesTable` — existing columns `creditCardId`, `creditCardTxnType`, `excludeFromSpending` already in schema
- **Spending model**: Accrual-based. Purchases hit `spentThisMonth` immediately (`excludeFromSpending = 0`). Bill payments excluded (`excludeFromSpending = 1`). Interest charges count toward budget (`excludeFromSpending = 0`).
- **usedAmount**: Stored running total on `creditCardsTable`. Updated atomically inside DB transactions on every write path (create, update, delete, pay, interest). Never derived on read.
- **amountDue**: Derived at query time only. FIFO cycle attribution — payments reduce the oldest unpaid cycle first. Exposed as `{ carried, newPurchases, total }` on the summary object.
- **Interest rate**: Stored as monthly rate (real) per card. UI accepts APR or monthly with a toggle; APR is divided by 12 before storing. Prompted lazily — never at onboarding or card creation.
- **Payment allocation**: FIFO oldest-cycle-first. Each payment row stores the `statementMonth` it is attributed to.
- **Auto-generated transactions**: Bill payments and interest charges use fixed category, fixed description from string constants, no user input on either field.

---

## Phase 1 — DB Write Integrity

**User stories**: 12, 14, 16, 18, 19

### What to build

Fix all three expense write paths so `usedAmount` stays accurate and spending aggregates exclude bill payments.

When a credit card purchase is created, `usedAmount` on the card increments by the expense amount inside the same DB transaction. When an expense is edited, `usedAmount` adjusts by the delta (new amount − old amount); if the expense has a `creditCardExpenses` row, that row's statement fields are recomputed for the new date. When an expense is deleted, the corresponding `creditCardExpenses` or `creditCardPayments` row is deleted and `usedAmount` is adjusted accordingly. If any write would take `usedAmount` below zero, an alert is surfaced to the user (non-blocking — the write proceeds).

All spending aggregate queries (`getTotalSpentByMonth`, `getSpendingByCategory`, `getImpulsePurchaseStats`) gain an `excludeFromSpending = 0` filter so bill payments already in the DB do not inflate budget totals.

### Acceptance criteria

- [ ] Adding a credit card expense increments `usedAmount` by the exact expense amount
- [ ] Editing the amount of a credit card expense adjusts `usedAmount` by the delta only
- [ ] Editing the date of a credit card expense recomputes `statementMonth`, `statementEndDate`, and `dueDate` on the `creditCardExpenses` row
- [ ] Deleting a credit card expense decrements `usedAmount` and removes the `creditCardExpenses` row
- [ ] Deleting a bill payment expense increments `usedAmount` and removes the `creditCardPayments` row
- [ ] `usedAmount` never drifts from the sum of attributed expenses minus payments (verified manually or via test)
- [ ] An alert is shown (but write is not blocked) if `usedAmount` would go below zero
- [ ] `getTotalSpentByMonth` excludes rows where `excludeFromSpending = 1`
- [ ] `getSpendingByCategory` excludes rows where `excludeFromSpending = 1`
- [ ] `getImpulsePurchaseStats` excludes rows where `excludeFromSpending = 1`
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 2 — Transaction List Attribution

**User stories**: 26, 27, 28, 29

### What to build

Extend the expense query layer to return card display fields, then surface them in `TransactionCard` across every screen that renders transactions.

The `getExpensesWithCategory` and `getAllExpensesWithCategory` queries gain a left-join to `creditCardsTable` and return `creditCardTxnType`, card nickname, last4, and provider color alongside every expense row. No extra per-row queries are needed in the UI.

`TransactionCard` gains four optional props: `creditCardNickname`, `creditCardLast4`, `creditCardColor`, `isBillPay`. When card props are present, the subtitle renders as `Category · Date · [coloured dot] Nickname ••last4`. When `isBillPay` is true, a "Bill Pay" pill badge renders inline with the title. Non-card rows are visually unchanged.

The dashboard recent-transactions list and the all-transactions screen both pass the new fields from query results into `TransactionCard`. The `useAllExpenses` hook is updated to carry the new fields through its section-list shape.

### Acceptance criteria

- [ ] A credit card purchase row shows `[dot] Nickname ••last4` in the subtitle
- [ ] Each card's dot uses a distinct provider colour (not all cards look the same)
- [ ] A bill payment row shows the "Bill Pay" badge next to the title
- [ ] A non-card expense row looks identical to today — no badge, no attribution
- [ ] Attribution and badge display correctly in both the dashboard and all-transactions screen
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 3 — Bill Payment Flow

**User stories**: 20, 21, 22, 23, 24, 25

### What to build

Implement the full bill payment write path and the UI to trigger it.

A `createCreditCardPayment` DB function performs three writes atomically: inserts an expense row with `excludeFromSpending = 1`, `creditCardTxnType = 'payment'`, auto-category "Bills", and an auto-description from a string constant; inserts a `creditCardPayments` row; decrements `creditCards.usedAmount`. The mutation is exposed via `useCreditCards`.

A `PayBillModal` component opens from the credit card settings screen and the card detail screen (Phase 4). It prefills the amount field with `amountDue` from the card summary. Date defaults to today. Submitting calls the mutation. On success, credit card summaries and expense queries are invalidated so every screen reflects the payment immediately.

Because Phase 2 is complete, bill payments automatically appear in the transaction list with the "Bill Pay" badge as soon as they are created.

### Acceptance criteria

- [ ] "Pay Bill" button on the settings card list opens `PayBillModal` for the correct card
- [ ] Amount field is prefilled with the current `amountDue` (editable)
- [ ] Date field defaults to today (editable)
- [ ] Submitting creates an expense with `excludeFromSpending = 1` and category "Bills"
- [ ] Auto-description matches the string constant (e.g. "Bill paid for Millennia")
- [ ] `usedAmount` on the card decrements by the payment amount after submission
- [ ] The new bill payment row appears in the transaction list with the "Bill Pay" badge
- [ ] Bill payment does not appear in `spentThisMonth` on the dashboard
- [ ] Credit card summaries query is invalidated on success so `usedAmount` / `amountDue` refresh
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 4 — getCreditCardSummaries Fix + Card Detail Screen

**User stories**: 30, 31, 32, 33, 34, 37, 38, 46, 47

### What to build

Fix the `amountDue` calculation to use FIFO cycle attribution and build the card detail screen.

`creditCardPaymentsTable` gains a `statementMonth` column. `getCreditCardSummaries` is rewritten: for each card, it iterates open statement cycles oldest-first, subtracts payments attributed to each cycle, and accumulates the unpaid remainder. The returned summary exposes `amountDue` as `{ carried, newPurchases, total }` — carried is the sum of all prior unpaid cycles, newPurchases is the current open cycle's total, and total is their sum. The `dueDate` on the summary is the due date of the oldest unpaid cycle.

The `/credit-cards/[id]` screen renders a `CreditCardPreviewCard` at the top (display-only, showing `usedAmount`, `creditLimit`, the `amountDue` breakdown, and `dueDate`). Below it, a `SectionList` shows all expenses attributed to this card, grouped by date, with the same category filter, date-range filter, and type toggle controls as the all-transactions screen. Tapping a row navigates to the transaction detail screen.

### Acceptance criteria

- [ ] `getCreditCardSummaries` returns the correct `amountDue.total` when payments partially cover a cycle
- [ ] `amountDue.carried` is non-zero when a prior cycle has an unpaid balance
- [ ] `amountDue.newPurchases` reflects only the current open cycle's purchases
- [ ] `dueDate` is the due date of the oldest unpaid cycle (not always the current cycle)
- [ ] Tapping a card in the dashboard carousel navigates to `/credit-cards/[id]`
- [ ] Card detail screen shows `CreditCardPreviewCard` with live `usedAmount`, `creditLimit`, `amountDue`, and `dueDate`
- [ ] Transaction list below the card shows only expenses attributed to that card
- [ ] Category, date-range, and type filters work correctly on the scoped list
- [ ] Tapping a transaction navigates to the transaction detail screen
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 5 — All-Transactions Credit Card Filter

**User stories**: 35, 36

### What to build

Add a credit card filter to the all-transactions screen's filter modal.

The existing filter state type gains an optional `creditCardId` field. The filter modal gains a card dropdown (same searchable `BDropdown` pattern as the category filter). When a card is selected, the active filter chips row shows a removable card chip. The `getAllExpensesWithCategory` query (and the `useAllExpenses` hook) honours the `creditCardId` filter when set.

### Acceptance criteria

- [ ] Filter modal on all-transactions screen shows a "Card" dropdown populated with the user's active cards
- [ ] Selecting a card filters the transaction list to only expenses attributed to that card
- [ ] An active card filter renders as a removable chip consistent with the category and date chips
- [ ] Removing the chip clears the card filter and restores all transactions
- [ ] Credit card filter composes correctly with category and date-range filters simultaneously
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 6 — Partial Payment Interest (PayBillModal path)

**User stories**: 40, 41, 42, 43, 44, 45

### What to build

Detect partial payments in `PayBillModal` and automatically calculate and log an interest charge.

`creditCardsTable` gains a `monthlyInterestRate` nullable column. A new migration is generated. A reusable rate input component renders a numeric field with an APR/Monthly toggle; APR input is divided by 12 before the monthly rate is stored. This component is shared between this phase and Phase 7.

When the user submits a payment in `PayBillModal` with an amount less than `amountDue.total`, the modal detects the partial payment. If `monthlyInterestRate` is null for that card, the rate input component is shown inline before the submit completes. Once a rate is available (newly entered or already stored), the interest amount is calculated as `unpaidBalance × monthlyRate`. An interest expense is auto-created: `excludeFromSpending = 0` (counts toward budget), auto-category "Bills", auto-description from a string constant, `creditCardTxnType = 'purchase'`, and `usedAmount` increments by the interest amount. The rate is persisted to the card.

### Acceptance criteria

- [ ] Submitting a full payment (amount = `amountDue.total`) does not trigger an interest prompt or create an interest transaction
- [ ] Submitting a partial payment when no rate is stored shows the APR/Monthly rate input inline
- [ ] APR entry is divided by 12 and stored as the monthly rate
- [ ] Monthly entry is stored as-is
- [ ] Submitting a partial payment when a rate is already stored skips the rate prompt entirely
- [ ] Interest transaction is created with `excludeFromSpending = 0`
- [ ] Interest amount = unpaid balance × monthly rate (correct to 2 decimal places)
- [ ] Interest transaction appears in the transaction list
- [ ] Interest transaction increments `spentThisMonth` on the dashboard
- [ ] `usedAmount` on the card increases by the interest amount
- [ ] Monthly rate is saved to the card and reused on the next partial payment without re-prompting
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

---

## Phase 7 — Overdue Modal (App-Load Path)

**User stories**: 39, 48, 49, 50, 51, 52

### What to build

Detect past-due unpaid balances on app open and surface a blocking modal that forces the user to resolve each card.

The recurring engine (run on app open) gains an overdue detection pass. For each active card it checks whether today is past the `dueDate` of any open cycle with an unpaid balance. Cycles that have already had interest logged in a previous run are skipped (idempotent). Cards with unresolved overdue cycles are queued.

A full-screen non-dismissible modal renders one queued card at a time. The card name, unpaid balance, and a late-fee warning ("Your bank may have also charged a late payment fee — log it manually as a separate transaction") are shown. The user chooses:

- **"I paid"** — enters amount and date. The payment is recorded via the same FIFO `createCreditCardPayment` path from Phase 3. If the amount is less than the unpaid balance, the rate input from Phase 6 is shown and interest is logged on the remaining unpaid amount.
- **"I haven't paid"** — the rate input from Phase 6 is shown and interest is logged on the full unpaid balance.

After each card is resolved the modal advances to the next queued card. When all cards are resolved the modal dismisses and the app proceeds normally.

A `// TODO: trigger notification` placeholder is added to `getCreditCardSummaries` at the point where `usedAmount > amountDue.total` for any card.

### Acceptance criteria

- [ ] On app open, if no cards are overdue the modal does not appear
- [ ] On app open, if one or more cards are overdue the full-screen modal appears and cannot be dismissed by swiping or tapping outside
- [ ] Modal shows the correct card name and unpaid balance for the current queued card
- [ ] Late fee warning text is visible on every card in the queue
- [ ] "I paid" path records a payment and advances to the next card
- [ ] "I paid" with a partial amount triggers the rate input and logs an interest transaction
- [ ] "I haven't paid" path shows the rate input and logs interest on the full unpaid balance
- [ ] Multiple overdue cards are queued and resolved one at a time in the same modal
- [ ] Re-opening the app after resolving all cards does not show the modal again for the same cycles (idempotent)
- [ ] `// TODO: trigger notification` comment exists in `getCreditCardSummaries` at the correct check point
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
