# PRD: Credit Card Expense Tracking

## Problem Statement

Users of the app frequently pay for daily expenses using credit cards, but the app has no native concept of a credit card. This means:

- There is no way to attribute an expense to a specific card, so users can't see which card they used for which purchase.
- Credit utilisation (how much of a card's limit has been used) is not tracked anywhere.
- Upcoming bill payments are invisible — users have no in-app reminder of what they owe and when.
- When a user pays their credit card bill, there is no way to log that payment or link it back to the card it settles.
- The transaction list is flat and gives no signal about the payment method used.

The result is that users who primarily spend via credit card get an incomplete, misleading picture of their finances.

---

## Solution

Introduce a first-class credit card entity in the app. Each card stores its core metadata (bank, provider, nickname, last 4 digits, credit limit, statement day, payment buffer). The app then:

1. Lets users add and manage their credit cards (settings screen + onboarding step).
2. Allows any expense to be attributed to a card, recording it as a purchase on that card.
3. Tracks a running credit utilisation balance (`usedAmount`) per card — updated atomically on every purchase, edit, and payment.
4. Derives the amount due for the current statement cycle at query time, giving users visibility into their upcoming bill.
5. Supports recording a bill payment as a dedicated transaction that settles the card and is excluded from the monthly spending budget (since the purchase itself already counted).
6. Displays card attribution inline in every transaction row, and marks bill payments with a "Bill Pay" badge.
7. Provides a per-card detail screen showing the card summary and its full transaction history.

The spending model is **accrual-based**: a purchase hits the monthly budget the moment it is made (regardless of when the bill is paid), giving users timely warnings about overspending. Bill payments are excluded from the budget because the spending was already counted at purchase time.

When a user pays less than the full amount due, interest accrues on the unpaid balance. The app stores a monthly interest rate per card (prompted at first partial payment, not during onboarding), calculates interest automatically, and logs it as a real expense that impacts the monthly budget. An on-load blocking modal handles the case where the due date passes without the user opening the app.

---

## User Stories

### Credit Card Management

1. As a user, I want to add a new credit card with its nickname, bank, provider, last 4 digits, credit limit, statement day, and payment buffer, so that the app knows about my card.
2. As a user, I want to see all my credit cards listed in the Settings screen with a count, so that I can manage them easily.
3. As a user, I want to edit an existing credit card's details, so that I can correct mistakes or update my limit.
4. As a user, I want to delete a credit card I no longer use, so that my card list stays clean.
5. As a user, I want to be asked for confirmation before a card is deleted, so that I don't accidentally lose data.
6. As a user, I want to add my credit cards during onboarding, so that my first experience includes card tracking from day one.
7. As a user, I want to see a live card-shaped preview while filling in the add/edit form, so that I can visually verify the details before saving.

### Dashboard Carousel

8. As a user, I want to see each of my credit cards as a swipeable card in the dashboard carousel, so that I can glance at my balance at a glance.
9. As a user, I want each dashboard card to show the bank, provider, nickname, last 4 digits, credit limit, used amount, and next due date, so that I have a full snapshot without opening the card detail screen.
10. As a user, I want carousel dot indicators to show my position across the budget card and credit card cards, so that I know how many cards there are and where I am.
11. As a user, I want tapping a card in the carousel to open that card's detail screen, so that I can explore its transactions.

### Credit Utilisation

12. As a user, I want the app to automatically update my card's used amount whenever I add, edit, or delete an expense attributed to that card, so that utilisation is always accurate.
13. As a user, I want to see utilisation percentage (used ÷ limit) on the card preview, so that I can monitor how close I am to my limit.
14. As a user, I want to be alerted if recording a payment would take my used amount below zero, so that I am aware of a possible data inconsistency.

### Expense Attribution

15. As a user, I want to select a credit card when adding an expense, so that the purchase is attributed to the right card.
16. As a user, I want credit card purchases to immediately reduce my monthly budget, so that I have a real-time view of how much I have left to spend.
17. As a user, I want each purchase to be assigned to a statement cycle automatically based on my card's statement day, so that I don't have to do date maths myself.
18. As a user, I want to change the amount or date of a credit card expense and have the card's used amount adjust by the delta, so that the balance stays accurate.
19. As a user, I want to delete a credit card expense and have the card's used amount decrease accordingly, so that there is no stale data.

### Bill Payments

20. As a user, I want to record a bill payment against a specific card from the card detail or settings screen, so that I can log when I settle my bill.
21. As a user, I want the bill payment amount to be prefilled with the current amount due, so that I don't have to type it manually in the common case.
22. As a user, I want bill payments to use a fixed category ("Bills") and an auto-generated description ("Bill paid for {card nickname}"), so that I don't have to categorise them manually.
23. As a user, I want bill payments to appear in my main transaction list with a "Bill Pay" badge, so that I have a full audit trail.
24. As a user, I want bill payments to be excluded from my monthly spending budget, so that my spending total is not inflated by what is really a debt settlement.
25. As a user, I want a bill payment to reduce the card's used amount, so that the utilisation reflects the payment.

### Transaction List Attribution

26. As a user, I want to see the card nickname and last 4 digits inline in the transaction subtitle for any expense paid by credit card, so that I can identify the payment method at a glance.
27. As a user, I want a coloured dot next to the card attribution in the subtitle, so that I can visually distinguish between different cards.
28. As a user, I want bill payment rows to show a "Bill Pay" badge next to the title, so that they are clearly distinguished from regular expenses.
29. As a user, I want non-card expenses to look exactly as they do today, so that the change is additive and not disruptive.

### Card Detail Screen

30. As a user, I want to open a card detail screen by tapping a card in the carousel, so that I can explore that card's activity.
31. As a user, I want the card detail screen to show the card preview (bank, provider, nickname, last 4, used amount, credit limit, due date) at the top, so that the context is clear.
32. As a user, I want the card detail screen to list all transactions attributed to that card, most recent first, so that I can review my spending.
33. As a user, I want to filter the card's transactions by date range and category, same as the all-transactions screen, so that I can narrow down my view.
34. As a user, I want to tap a transaction in the card detail screen to open the transaction detail screen, so that I can view or edit it.

### All-Transactions Filter

35. As a user, I want to filter the all-transactions screen by a specific credit card, so that I can see all purchases on one card across any date range.
36. As a user, I want the active card filter to show as a removable chip on the all-transactions screen, consistent with other active filters, so that the filter state is visible.

### Amount Due & Notifications

37. As a user, I want the app to compute the amount due for the current statement cycle (sum of purchases in that cycle), so that I know what my next bill will be.
38. As a user, I want this amount due to be visible on the card detail screen broken down as "₹X carried from previous cycle + ₹Y new purchases", so that I understand exactly what I owe and why.
39. As a user, I want the app to log a notification trigger when my used amount exceeds the amount due for the current cycle (groundwork only — notification UI is out of scope), so that future notification work has a clear hook.

### Partial Payments & Interest

40. As a user, I want the app to detect when I have paid less than the full amount due and prompt me to enter my card's interest rate, so that interest can be calculated accurately.
41. As a user, I want to enter my interest rate as either APR or monthly rate with a toggle between the two, so that I can use the format quoted on my card statement without doing mental maths.
42. As a user, I want the interest rate to be stored per card after the first entry, so that I am not prompted again on future partial payments.
43. As a user, I want the app to automatically calculate and log an interest charge transaction when I make a partial payment, so that my financial picture reflects the true cost of carrying a balance.
44. As a user, I want the interest charge to appear in my main transaction list and count toward my monthly spending budget, so that I feel the real financial impact of not paying in full.
45. As a user, I want the interest charge to also increase my card's used amount, so that my outstanding balance stays accurate.
46. As a user, I want payments to be applied to the oldest unpaid statement cycle first (FIFO), so that the app behaves the same way as my bank.
47. As a user, I want the amount due to reflect unpaid balances carried from previous cycles separately from new purchases, so that I can see the full picture of what I owe.
48. As a user, when I open the app and a bill due date has passed with an unpaid balance, I want a full-screen modal to appear that I cannot dismiss until I resolve it, so that I cannot ignore outstanding obligations.
49. As a user, in the overdue modal I want the option to confirm I have already paid, entering the amount and date, so that the app catches up with what I did outside the app.
50. As a user, in the overdue modal I want the option to confirm I have not paid, so that interest is immediately logged on the full unpaid balance.
51. As a user, if I have multiple overdue cards, I want the modal to queue them one by one in a single screen, so that I can resolve all of them in one flow without multiple interruptions.
52. As a user, I want a warning in the interest flow reminding me to manually log any late payment fee my bank may have charged, so that I am aware it is not automatically tracked.

---

## Implementation Decisions

### Spending Model

- **Accrual-based**: a credit card purchase counts toward `spentThisMonth` the moment it is created, regardless of when the bill is paid.
- Bill payments are excluded from the monthly spending budget (`excludeFromSpending = 1`) because the spending was already captured at purchase time.
- All existing spending queries (`getTotalSpentByMonth`, `getSpendingByCategory`, `getImpulsePurchaseStats`) must be updated to filter `excludeFromSpending = 0`.

### usedAmount — Stored Running Total

- `usedAmount` is a stored column on the credit cards table, not derived on every read. This avoids repeated aggregation queries on every render.
- It is updated atomically inside database transactions on:
  - **Create purchase**: increment by expense amount.
  - **Edit purchase**: adjust by the delta (new amount − old amount).
  - **Delete purchase**: decrement by expense amount.
  - **Create payment**: decrement by payment amount. Alert the user (do not block) if the result goes below zero.
- The computation must be airtight — every write path that touches a credit card expense must update `usedAmount` in the same transaction.

### amountDue — Derived at Query Time

- `amountDue` is NOT stored. It is computed in `getCreditCardSummaries()` by summing the amounts of all expenses in `creditCardExpensesTable` whose `statementMonth` matches the current open cycle.
- It is exposed on the summary object so the card detail screen and future notification logic can consume it without extra queries.

### Statement Cycle Assignment

- When a purchase is created, its `statementMonth` (`YYYY-MM`), `statementEndDate`, and `dueDate` are computed from the purchase date and the card's `statementDayOfMonth` + `paymentBufferDays`.
- These are written to `creditCardExpensesTable`. The expense row itself stores only `creditCardId` and `creditCardTxnType`.

### Bill Payment Write Path

- A bill payment writes to three places atomically:
  1. Insert into `expenses` with `excludeFromSpending = 1`, `creditCardTxnType = 'payment'`, auto-category "Bills", auto-description from a string constant.
  2. Insert into `creditCardPaymentsTable`.
  3. Decrement `creditCards.usedAmount`.

### Interest Rate Storage

- `monthlyInterestRate` stored as a nullable real column on the credit cards table. Null means "not yet set".
- Not prompted during onboarding or card creation — only prompted the first time a partial payment is detected.
- UI toggle (APR ↔ Monthly) converts APR input by dividing by 12 before storing. Only the monthly rate is persisted.
- Once set, reused silently for all future interest calculations on that card without re-prompting.

### Partial Payment Detection & Interest Calculation

- **Two payment states only**: full payment (amount = `amountDue`) and partial payment (amount < `amountDue`).
- On partial payment: `unpaidBalance = amountDue − paymentAmount`. Interest = `unpaidBalance × monthlyInterestRate`.
- Interest is logged as an auto-generated expense: `excludeFromSpending = 0` (counts toward budget), auto-category "Bills", auto-description from a string constant (e.g. "Interest charged – {card nickname}"), `creditCardTxnType = 'purchase'`, increments `usedAmount`.
- Interest transaction is NOT written to `creditCardExpensesTable` — it is a card-level charge, not a user purchase, and should not inflate statement cycle totals.

### Cycle-Attributed Payments (Option B carry-forward)

- `creditCardPaymentsTable` stores a `statementMonth` column so each payment is linked to the cycle it settles.
- Payments are attributed FIFO — oldest unpaid cycle is settled first; any remainder rolls to the next cycle.
- `getCreditCardSummaries()` computes `amountDue` as: sum of unpaid cycle balances (purchases minus payments attributed to that cycle, across all open cycles). The breakdown (carried vs new) is exposed on the summary object.

### On-Load Overdue Modal (Trigger B)

- The recurring engine (run on app open) checks each active card: if today > `dueDate` for any cycle that has an unpaid balance, that card is flagged as overdue.
- A full-screen non-dismissible modal is shown, queuing all overdue cards one by one.
- Per card, the user chooses:
  - **"I paid"** → enter amount + date → payment recorded (FIFO cycle attribution) → if partial, prompt for interest rate if not set → interest logged.
  - **"I haven't paid"** → prompt for interest rate if not set → interest logged on full unpaid balance.
- Warning text displayed: "Your bank may have also charged a late payment fee. Log it manually as a separate transaction."
- Modal only dismisses after all queued cards are resolved.

### Delete Cascade (manual, not DB-level)

- Deleting a credit card purchase must also delete the corresponding `creditCardExpensesTable` row and decrement `usedAmount` in the same transaction.
- Deleting a bill payment must also delete the `creditCardPaymentsTable` row and increment `usedAmount`.

### TransactionCard Component

- New optional props: `creditCardNickname`, `creditCardLast4`, `creditCardColor`, `isBillPay`.
- When card props are present, the subtitle renders: `Category · Date · [coloured dot] Nickname ••last4`.
- When `isBillPay` is true, a "Bill Pay" pill badge renders next to the title.
- Non-card rows are unchanged.

### Query Layer — Credit Card Join

- `getExpensesWithCategory` and `getAllExpensesWithCategory` must be extended to join `creditCardsTable` and return `creditCardTxnType`, `creditCardNickname`, `creditCardLast4`, and the card's provider color, so that `TransactionCard` has everything it needs without extra per-row queries.

### Card Detail Screen

- Layout: `CreditCardPreviewCard` header (non-editable, display-only) + transaction `SectionList` filtered to that card.
- Filter surface mirrors `all-transactions` exactly: category, date range, type toggle. No card filter (already scoped to one card).

### All-Transactions Credit Card Filter

- New filter field in the filter modal: card dropdown.
- Active card filter renders as a removable chip.
- Backed by an optional `creditCardId` field in the existing filter state type.

### Modules to Build / Modify

| Module                    | Action                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credit Card Query Module  | Modify: fix `getCreditCardSummaries` cycle-attributed amountDue; add `createCreditCardPayment` with FIFO cycle attribution; wire `usedAmount` updates into all write paths; add `computeInterestCharge` |
| Expense Query Module      | Modify: add `usedAmount` side-effects to create/update/delete; add `excludeFromSpending` filters to all spending aggregates; extend category join queries to return credit card fields                  |
| Recurring Engine          | Modify: add overdue card detection pass; trigger on-load overdue modal when past-due cycles exist                                                                                                       |
| Overdue Modal             | Build: full-screen non-dismissible modal; queues overdue cards; handles "paid" and "not paid" paths; collects interest rate if unset; logs interest transaction                                         |
| Interest Rate Prompt      | Build: reusable APR/Monthly toggle input, used in both PayBillModal (partial payment) and Overdue Modal                                                                                                 |
| TransactionCard Component | Modify: add card attribution + Bill Pay badge props                                                                                                                                                     |
| All-Transactions Screen   | Modify: pass credit card props to `TransactionCard`; add card filter chip to filter modal                                                                                                               |
| Card Detail Screen        | Build: new screen with `CreditCardPreviewCard` header + scoped filtered transaction list                                                                                                                |
| useCreditCards Hook       | Modify: add `createCreditCardPaymentAsync` and `logInterestChargeAsync` mutations                                                                                                                       |

---

## Testing Decisions

### What makes a good test

- Test external behaviour (inputs → outputs / side-effects), not internal implementation details.
- Each test should be independent and not rely on shared mutable state.
- Prefer testing at the module boundary: call the public function and assert on its return value or the resulting DB state.

### Modules to test

**Credit Card Query Module** — highest priority, most logic:

- `getCreditCardSummaries`: verify `amountDue` is the correct sum of unpaid cycle balances with FIFO payment attribution; verify carried balance + new purchases breakdown is accurate; verify `usedAmount` is passed through from stored value.
- `createCreditCardPayment`: verify all writes occur atomically (expense row, payment row, cycle attribution, usedAmount decrement); verify `excludeFromSpending = 1` on the inserted expense; verify FIFO allocation across multiple open cycles.
- `computeInterestCharge`: verify interest = unpaidBalance × monthlyRate; verify the resulting transaction increments `usedAmount`; verify `excludeFromSpending = 0`.
- `usedAmount` side-effects in expense writes: create a purchase and assert `usedAmount` incremented; edit the amount and assert the delta was applied; delete the expense and assert `usedAmount` decremented.

**Date Utility Helpers** — pure functions, easy to test exhaustively:

- `computeStatementMonthForPurchase`: purchases before and after the statement day should land in different months.
- `computeStatementEndDate`: day-31 cards in February should clamp to the last day of February.
- `computeDueDate`: buffer days that cross a month boundary should land in the correct month.

**No UI component tests** in scope for this PRD.

---

## Out of Scope

- Push / local notifications for upcoming bill due dates (the notification trigger hook is in scope as a log/comment; the notification UI is not).
- Minimum payment tracking — the app records full payment amounts only.
- Daily balance interest method (app uses simplified monthly rate × unpaid balance; daily accrual is out of scope).
- Multiple currencies per card.
- Importing transactions automatically from bank feeds or SMS.
- Editing which statement cycle a purchase belongs to.
- Card detail screen showing statement-grouped views (purchases are shown in a flat date-sorted list).
- Reward points or cashback tracking.

---

## Further Notes

- The `usedAmount` field must be treated as a cache of truth derived from expenses. If data integrity bugs are discovered later, a repair migration can recompute it from the expense table. A comment in the query module should document this recovery path.
- The "Bill Pay" auto-description copy (`Bill paid for ${card.nickname}`) must live in a string constants file, not be hardcoded inline.
- The credit card filter on the all-transactions screen is noted as a follow-on addition and should not block the card detail screen or transaction attribution work.
- The `getCreditCardSummaries` notification trigger (log/comment when `usedAmount > amountDue`) is a placeholder for a future notification system and should be implemented as a clearly labelled `// TODO: trigger notification` comment or a no-op logger call.
- The interest rate APR↔Monthly toggle is a reusable input component — it must be shared between the PayBillModal partial payment flow and the Overdue Modal, not duplicated.
- The overdue detection in the recurring engine must be idempotent: if interest has already been logged for a cycle in the current run, it must not be logged again on subsequent app opens for the same cycle.
- The auto-description for interest charges (e.g. "Interest charged – {card nickname}") must live in a string constants file alongside the bill payment copy.
