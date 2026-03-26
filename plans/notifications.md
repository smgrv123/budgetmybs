# Plan: Notifications Integration

> Source PRD: [GitHub Issue #5](https://github.com/smgrv123/budgetmybs/issues/5)

## Architectural Decisions

Durable decisions that apply across all phases:

- **Notification library**: `expo-notifications` — local, on-device, no internet required
- **Scheduling entry point**: single `scheduleAllNotifications({ fixedExpenses, debts, creditCards })` function — all callers go through this one interface
- **Scheduler hook mount point**: `dashboard/_layout.tsx` — covers app open and in-session data changes
- **Trigger timing**: random hour (12–20) and minute (0–59) per notification per reschedule
- **Reminder cadence**: 2 days before due date + on the due date itself
- **Notification identifier format**: `{type}-{itemId}-{timing}` (e.g. `fixed-abc123-2day`, `debt-xyz-dayof`)
- **Copy rotation**: AsyncStorage tracks last-used copy index per scenario pool key to avoid immediate repeats
- **Strings**: all copy lives in `src/constants/notifications.strings.ts`, no hardcoded strings in service or hooks
- **Date arithmetic**: dayjs only — never raw Date
- **Data source**: TanStack Query hooks (`useFixedExpenses`, `useDebts`, `useCreditCards`) — no direct DB imports in hooks or service
- **In-app alerts**: existing `BToast` component — no new UI primitives needed
- **Permission strategy**: check on dashboard load, ask once if `undetermined`, never re-ask if `denied`

---

## Phase 1: Foundation — Install & Permission Flow

**User stories**: 12, 13, 20

### What to build

Install `expo-notifications` and build the permission gate. A new `useNotificationPermissions` hook handles the full permission lifecycle: checks current status on mount, requests permission if `undetermined`, and silently no-ops if `denied` or `granted`. This hook is mounted once inside `dashboard/_layout.tsx`. No notifications are scheduled yet — but the permission infrastructure is live and correct on both iOS and Android 13+/12 and below.

### Acceptance criteria

- [ ] `expo-notifications` is installed and linked in the Expo config
- [ ] `useNotificationPermissions` hook runs on every dashboard load
- [ ] On first launch (status `undetermined`), the OS permission dialog is shown to the user
- [ ] If user grants permission, no further prompts ever appear
- [ ] If user denies permission, no further prompts ever appear across sessions
- [ ] On Android <13, permission is treated as auto-granted (no dialog shown)
- [ ] Hook is mounted in `dashboard/_layout.tsx` with no visible UI change
- [ ] Lint, type-check, and format pass with no errors

---

## Phase 2: Notification Service & Copy Pools

**User stories**: 7, 8, 9, 10, 11

### What to build

Build the pure notification service — no React dependencies, fully testable in isolation. It contains all core logic:

- **Date computation**: given a `dayOfMonth` and today's date, return the day-of and 2-day-before trigger dates. If the date has already passed this month, schedule for next month. Handle month boundary edge cases with dayjs.
- **Credit card due date computation**: given `statementDayOfMonth` and `paymentBufferDays`, return the payment due date with month overflow handled correctly.
- **Random time picker**: return a random hour (12–20) and minute (0–59) for a given notification.
- **Copy picker**: given a scenario pool key, read last-used index from AsyncStorage, pick a different random copy, write the new index back.
- **scheduleAllNotifications**: the single public entry point — accepts `{ fixedExpenses, debts, creditCards }`, cancels all existing scheduled notifications, and reschedules from scratch. (Fixed expense and debt scheduling wired here; credit cards in Phase 4; monthly check-in in Phase 5.)

Also build `src/constants/notifications.strings.ts` with all 7 copy pools (FIXED_EXPENSE_2DAY, FIXED_EXPENSE_DAY_OF, DEBT_EMI_2DAY, DEBT_EMI_DAY_OF, CREDIT_CARD_2DAY, CREDIT_CARD_DAY_OF, MONTHLY_CHECKIN), each with 4–6 copy variants. Amounts shown for fixed expenses and debts; omitted for credit cards. Tone: casual & friendly for 2-day reminders, witty/self-aware urgency for day-of.

Write unit tests for:

- Day-of and 2-day-before date computation including month overflow
- Credit card due date computation with buffer overflow
- Copy picker never repeating the last used copy
- Random time always falling within 12:00–20:00

### Acceptance criteria

- [ ] Notification service is a pure module with no React or hook imports
- [ ] Date computation correctly handles: mid-month due dates, end-of-month due dates, dates already passed this month (rolls to next month), 2-day-before crossing a month boundary
- [ ] Credit card due date correctly handles `statementDay + buffer` overflowing into the next month
- [ ] Copy picker never returns the same copy twice in a row per scenario pool
- [ ] Random time is always between 12:00:00 and 20:59:59
- [ ] All 7 copy pools exist with at least 4 variants each
- [ ] No hardcoded strings outside `notifications.strings.ts`
- [ ] All unit tests pass
- [ ] Lint, type-check, and format pass with no errors

---

## Phase 3: Fixed Expense & Debt Reminders

**User stories**: 1, 2, 3, 4, 14, 19, 21, 22, 24

### What to build

Build `useNotificationScheduler` hook that consumes `useFixedExpenses` and `useDebts` query data. A single `useEffect` watches both data arrays — whenever either changes (due to TanStack Query invalidation from any mutation), it calls `scheduleAllNotifications(...)`. Mount this hook inside `dashboard/_layout.tsx` alongside the permissions hook from Phase 1.

This delivers the first real end-to-end notifications: all active fixed expenses and debts get two OS notifications each (2-day-before + day-of), with amounts in the body, copy rotating across reschedules, and firing at a random time between 12pm–8pm. Tapping any notification opens the dashboard home.

### Acceptance criteria

- [ ] `useNotificationScheduler` is mounted in `dashboard/_layout.tsx`
- [ ] On app open, notifications are scheduled for all active fixed expenses and debts
- [ ] Each active fixed expense generates exactly 2 scheduled notifications (2-day-before + day-of)
- [ ] Each active debt generates exactly 2 scheduled notifications (2-day-before + day-of)
- [ ] Notifications include the item name and amount in the body
- [ ] Adding a new fixed expense or debt triggers a full reschedule automatically (no manual action)
- [ ] Editing a fixed expense or debt (including dayOfMonth) triggers a full reschedule automatically
- [ ] Deleting (deactivating) a fixed expense or debt removes its notifications automatically
- [ ] Tapping a notification navigates to the dashboard home screen
- [ ] Inactive fixed expenses and debts are excluded from scheduling
- [ ] Lint, type-check, and format pass with no errors

---

## Phase 4: Credit Card Reminders

**User stories**: 5, 6, 23, 24

### What to build

Extend `scheduleAllNotifications` to handle credit cards. Credit card due date logic is more complex: `statementDayOfMonth + paymentBufferDays` with potential month overflow. Amounts are omitted from credit card notification bodies (balance is variable). Extend `useNotificationScheduler` to also consume `useCreditCards` query data, adding it as a third dependency to the existing `useEffect`.

### Acceptance criteria

- [ ] Each active credit card generates exactly 2 scheduled notifications (2-day-before + day-of)
- [ ] Credit card due date correctly accounts for `statementDayOfMonth + paymentBufferDays` including month overflow
- [ ] Credit card notification bodies do not include an amount
- [ ] Adding, editing, or deleting a credit card triggers a full reschedule automatically
- [ ] Inactive credit cards are excluded from scheduling
- [ ] Existing fixed expense and debt reminders are unaffected
- [ ] Lint, type-check, and format pass with no errors

---

## Phase 5: Monthly Check-in

**User stories**: 15

### What to build

Add a repeating monthly check-in notification to `scheduleAllNotifications`. This uses a CalendarTrigger with `day: 1` — it fires on the 1st of every month and self-sustains without needing monthly rescheduling. The notification nudges the user to review their budget rollover and start logging expenses for the new month. Uses the MONTHLY_CHECKIN copy pool from Phase 2. Fires at a random time in the 12pm–8pm window like all other notifications.

### Acceptance criteria

- [ ] A single repeating notification fires on the 1st of every month
- [ ] Notification uses the MONTHLY_CHECKIN copy pool
- [ ] Notification fires at a random time between 12:00–20:59
- [ ] Tapping the notification navigates to the dashboard home
- [ ] The check-in notification is included in the full reschedule (cancelled and re-added on each reschedule)
- [ ] Lint, type-check, and format pass with no errors

---

## Phase 6: Budget Threshold BToast Alerts

**User stories**: 16, 17, 18

### What to build

Modify the expense save flow to check the frivolous budget threshold after a successful transaction save. After each expense is saved, compute `totalSpent / frivolousBudget` for the current month using data already available via `useMonthlyBudget`. If spending crosses 80%, show a `BToast` WARNING. If it exceeds 100%, show a `BToast` ERROR. Each threshold fires at most once per session (tracked in component state) to avoid repeated alerts. This is fully in-app — no OS notification involved.

Write unit tests for the threshold detection logic:

- Under 80%: no alert
- Exactly 80%: WARNING alert
- Between 80–100%: WARNING alert (only once)
- Exactly 100%: ERROR alert
- Over 100%: ERROR alert (only once)

### Acceptance criteria

- [ ] Saving an expense that pushes spending to ≥80% of frivolous budget shows a BToast WARNING
- [ ] Saving an expense that pushes spending to >100% of frivolous budget shows a BToast ERROR
- [ ] Each threshold alert fires at most once per app session (not on every subsequent expense)
- [ ] Alert does not fire for savings transactions (only expenses that count toward frivolous spending)
- [ ] Alert does not fire if notifications permission was denied (OS notifications off doesn't affect this — BToast is always shown)
- [ ] BToast variant, message, and duration match the existing BToast API
- [ ] All unit tests for threshold logic pass
- [ ] Lint, type-check, and format pass with no errors
