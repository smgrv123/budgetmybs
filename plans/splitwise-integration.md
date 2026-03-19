# Plan: Splitwise Integration

> Source PRD: Grill-me session — expense splitting via Splitwise API

## Architectural Decisions

- **Auth**: OAuth2 Authorization Code flow via `expo-auth-session`. Tokens stored in `expo-secure-store`. Silent re-auth on expiry. No backend — all auth happens client-side.
- **API client**: `splitwise-ts` `Client` class initialized with Bearer token obtained from `expo-auth-session` (bypass `OAuth2User` from the library — it uses Client Credentials, not Authorization Code).
- **Schema**: Extend existing `expensesTable` — no new tables. Add `sourceType: 'splitwise'` to enum, reuse `sourceId` for Splitwise expense ID, add `receivableAmount` (nullable number) and `receivableSettled` (boolean).
- **Sync queue**: New `splitwiseSyncQueueTable` for outbound operations that fail due to network/token issues. Retried on next app open or successful re-auth.
- **Currency**: INR-only. Foreign currency Splitwise expenses are skipped entirely.
- **Category mapping**: Splitwise category → budgetmybs category via a static map. Unmapped → `other`.
- **Receivables model**: When user is payer, `receivableAmount` is stored on the same expense row. Deducted from monthly budget until `receivableSettled = true`.
- **Split types**: All Splitwise-native split types supported (equal, exact amounts, percentages, shares, adjustment).

---

## Phase 1: Splitwise Auth & Connection

**User stories**:

- As a user, I can connect my Splitwise account from Settings
- As a user, I can see my connection status and disconnect if needed

### What to build

Add a "Splitwise" section to the Settings screen. Tapping "Connect" launches the OAuth2 Authorization Code flow via `expo-auth-session`, opening Splitwise's login page in the browser. On successful auth, the access token and refresh token are stored in Expo Secure Store. The app immediately calls `getCurrentUser` to verify the connection and displays the connected Splitwise account name. A "Disconnect" button clears the stored tokens.

### Acceptance criteria

- [ ] "Connect Splitwise" button visible in Settings when not connected
- [ ] Tapping it opens Splitwise OAuth login in browser
- [ ] On success, Settings shows connected Splitwise account name and avatar
- [ ] "Disconnect" clears tokens and returns to unconnected state
- [ ] Token persists across app restarts (Secure Store)
- [ ] If token is expired on app open, silent re-auth is attempted before showing "Reconnect" prompt

---

## Phase 2: DB Schema + Inbound Sync

**User stories**:

- As a user, when a friend adds me to a Splitwise expense, it appears in my budgetmybs transaction list
- As a user, synced expenses have a Splitwise badge so I can distinguish them
- As a user, expenses sync automatically when I open the app and when I pull to refresh

### What to build

Extend `expensesTable` schema with `receivableAmount`, `receivableSettled`, and update `sourceType` enum to include `'splitwise'`. Run a Drizzle migration.

On app open and pull-to-refresh, call Splitwise `getExpenses` filtered to INR. For each expense where the current user has a share: upsert a local expense row with `sourceType: 'splitwise'` and `sourceId: splitwiseExpenseId`. Record only the user's share as `amount`. Auto-map Splitwise category to budgetmybs category; fallback to `other`.

Show a Splitwise logo badge on any transaction row in the list where `sourceType === 'splitwise'`.

### Acceptance criteria

- [ ] `expensesTable` migration runs cleanly with new columns
- [ ] On app open, INR Splitwise expenses are fetched and upserted locally
- [ ] Pull-to-refresh on transactions list triggers a re-sync
- [ ] Each synced expense appears in the correct month based on Splitwise expense date
- [ ] Splitwise badge visible on synced expense rows in the transaction list
- [ ] Foreign currency expenses are silently skipped
- [ ] Splitwise category is mapped to nearest budgetmybs category; unmapped → `other`
- [ ] Re-syncing the same expense updates the local record (upsert, no duplicates)

---

## Phase 3: Dashboard Balances

**User stories**:

- As a user, I can see how much I am owed and how much I owe on the dashboard
- As a user, the budget progress bar reflects my open Splitwise balances

### What to build

Below the existing hero card on the dashboard, add a "Split Balances" section showing two values: "You are owed ₹X" (green) and "You owe ₹Y" (red). These are computed from the user's Splitwise friend balances fetched during sync and cached locally.

Update the monthly budget progress bar to use green for the receivable portion and red for the payable portion, visually distinguishing Splitwise balances from regular spending.

### Acceptance criteria

- [ ] "You are owed" and "You owe" amounts visible below hero card when Splitwise is connected
- [ ] Section is hidden entirely when Splitwise is not connected
- [ ] Amounts update after each sync
- [ ] Budget progress bar shows red/green segments for owed/owing amounts
- [ ] Tapping the balances section navigates to the full Splitwise friends balance list

---

## Phase 4: Outbound Split

**User stories**:

- As a user, I can split a new expense with Splitwise friends directly from the transaction form
- As a user, failed splits are queued and retried automatically

### What to build

Add a "Split this expense" toggle to the Add/Edit transaction form. When toggled on, a split configuration UI appears inline: friend/group picker (populated from `getFriends` and `getGroups`), split type selector (equal, exact, percentage, shares, adjustment), and per-person amount inputs.

On saving the transaction, the expense is created locally first, then pushed to Splitwise via `createExpense`. If the push fails (network, token), the operation is added to `splitwiseSyncQueueTable` and retried on next app open or successful re-auth.

If Splitwise is disconnected when the toggle is turned on, prompt re-auth. If the user cancels re-auth, toggle switches back off and the user stays on the form.

### Acceptance criteria

- [ ] "Split this expense" toggle visible on Add/Edit transaction form
- [ ] Toggling on shows friend/group picker populated from Splitwise account
- [ ] All Splitwise split types (equal, exact, percentage, shares, adjustment) are selectable
- [ ] Groups and individuals can be mixed in the same split
- [ ] Expense saved locally regardless of Splitwise push success
- [ ] Failed Splitwise push is queued and retried on next app open
- [ ] Disconnected state: toggle on → re-auth prompt → cancel → toggle off, form unchanged
- [ ] Successfully pushed expense shows Splitwise badge in transaction list

---

## Phase 5: Receivables & Settlement

**User stories**:

- As a user, when I pay for a group expense, the amount I'm owed is tracked and temporarily deducted from my budget
- As a user, when a friend settles their debt in Splitwise, my budget is automatically restored

### What to build

During inbound sync, detect when the current user is the payer of a Splitwise expense. Set `receivableAmount` to the portion owed back, and deduct this from the monthly budget remaining (in addition to the user's own share).

During each sync, check Splitwise for settled debts. When a receivable is detected as settled, set `receivableSettled = true` on the local expense row and add `receivableAmount` back to the monthly budget for that month.

The "You are owed" figure on the dashboard is derived from all rows where `receivableSettled = false` and `receivableAmount > 0`.

### Acceptance criteria

- [ ] When user is payer, `receivableAmount` is set correctly on the expense row
- [ ] Monthly budget remaining reflects the deduction of `receivableAmount`
- [ ] Dashboard "You are owed" total matches sum of unsettled `receivableAmount` values
- [ ] On sync, settled debts flip `receivableSettled = true`
- [ ] Monthly budget is restored by `receivableAmount` when settlement is detected
- [ ] Settled expenses no longer contribute to "You are owed" total

---

## Phase 6: Edit Conflict Resolution

**User stories**:

- As a user, when I edit a Splitwise-synced expense, I can choose to update it locally only or also push the change to Splitwise

### What to build

When a user saves edits to an expense with `sourceType === 'splitwise'`, show a bottom sheet or action sheet: "Update locally only" or "Update on Splitwise too." Choosing "locally only" saves the change to SQLite only. Choosing "Update on Splitwise too" calls `updateExpense` on the Splitwise API; failures are queued as in Phase 4.

### Acceptance criteria

- [ ] Editing a synced expense shows the choice prompt on save
- [ ] "Update locally only" saves to SQLite only, no API call
- [ ] "Update on Splitwise too" calls Splitwise `updateExpense`
- [ ] Failed Splitwise update is queued and retried
- [ ] Non-synced expenses (no `sourceType: 'splitwise'`) save without the prompt

---

## Phase 7: Onboarding Step

**User stories**:

- As a new user, I am offered the option to connect Splitwise during onboarding
- As a new user, I can skip this step without affecting the rest of onboarding

### What to build

Add a new skippable screen as the last step of the onboarding flow, before the success screen. It reuses the same OAuth2 connect flow from Phase 1. A prominent "Skip for now" link bypasses it. If the user connects successfully, they proceed to the success screen with Splitwise already linked.

### Acceptance criteria

- [ ] New onboarding screen appears after the existing final step
- [ ] "Connect Splitwise" button launches OAuth flow
- [ ] "Skip for now" bypasses without error
- [ ] Successfully connecting proceeds to onboarding success screen
- [ ] Skipping does not affect any other onboarding data
- [ ] Users who already completed onboarding are unaffected (step only shown on first run)

---

## Phase 8: Disconnection & Error Hardening

**User stories**:

- As a user, token expiry is handled silently without interrupting my workflow
- As a user, if I disconnect Splitwise, my previously synced expenses are kept with their badge
- As a user, queued sync operations are retried reliably after reconnection

### What to build

Harden all Splitwise API calls with the sync queue from Phase 4. On any 401 response, attempt silent token refresh before queuing. If refresh fails, surface a non-blocking "Reconnect Splitwise" banner (not a blocker modal).

On disconnect, clear tokens from Secure Store and mark the Splitwise connection as inactive. Do not delete or modify any existing expense rows — they retain `sourceType: 'splitwise'` and their badge. Flush the sync queue (drop pending operations) on intentional disconnect.

On reconnect (after re-auth), drain the sync queue in order.

### Acceptance criteria

- [ ] 401 on any API call triggers silent token refresh before failing
- [ ] Failed refresh shows non-blocking "Reconnect Splitwise" banner
- [ ] Disconnect clears tokens, does not delete any expense rows
- [ ] Disconnected expenses retain their Splitwise badge in the transaction list
- [ ] Sync queue is cleared on intentional disconnect
- [ ] Reconnecting triggers queue drain in insertion order
- [ ] App functions normally (local features) when Splitwise is disconnected
