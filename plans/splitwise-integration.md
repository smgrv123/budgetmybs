# Plan: Splitwise Integration

> Source PRD: [smgrv123/budgetmybs#35](https://github.com/smgrv123/budgetmybs/issues/35)

## Architectural Decisions

Durable decisions that apply across all phases:

- **OAuth**: Authorization Code flow with PKCE via `expo-auth-session`. Deep link `budgetmybs://auth/splitwise`. Client secret in `EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET` (on-device, MVP tradeoff — flagged for proxy migration).
- **Token storage**: `expo-secure-store`. Silent refresh on 401. On refresh failure: clear tokens, surface non-blocking "Reconnect Splitwise" prompt.
- **API client**: Generic typed HTTP client in `src/services/api/` (fetch-based, not Splitwise-specific). Exposes `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`. Auth via `AuthProvider` interface. Handles retry (2–3 attempts), timeout, rate-limit delay, typed errors (`NetworkError`, `AuthError`, `RateLimitError`, `ApiError`).
- **Splitwise API layer**: `src/services/splitwise/` — thin typed wrappers over the Splitwise REST API, no third-party SDK. Consumes generic HTTP client.
- **Splitwise update API**: `POST /update_expense/:id` (not PUT). Returns `{ expenses: [...], errors: {} }` — must check `errors` is empty, 200 OK does not mean success. User shares must be recalculated proportionally when cost changes (`users__N__paid_share`, `users__N__owed_share`).
- **Schema**: New `splitwise_expenses` table (FK → `expenses.id`). New enum values on `db/types.ts`: `IncomeTypeEnum.SPLITWISE_SETTLEMENT`.
- **Offline-first**: All writes go to SQLite first. Splitwise API push is a side-effect that can fail. Failed pushes queued in AsyncStorage (same pattern as `impulseAsyncStore.ts`). Queue drained on app open and pull-to-refresh.
- **Sync model**: Auto-sync on dashboard mount if stale >5 min (timestamp in AsyncStorage `SPLITWISE_LAST_SYNCED_AT`). Incremental by default (`updated_after`). Pull-to-refresh = full re-fetch (up to 200 INR expenses). 250ms delay between sequential API calls.
- **Balance source of truth**: `/get_friends` API (not local DB queries). Cached in AsyncStorage key `SPLITWISE_FRIEND_BALANCES`. Stale threshold same as sync (5 min). Includes friend avatars (`picture.medium`).
- **Group ID storage**: `splitwiseGroupId` stored during sync from `expense.group_id`. Used in update payloads. If null (old data), falls back to `remoteExpense.group_id` from conflict detection fetch.
- **Currency**: INR-only. Foreign currency expenses silently skipped.
- **Budget model**: Full cash outflow — when user pays ₹1000 for a 50/50 split, budget drops ₹1000 (not ₹500). Receivable displayed as "in transit."
- **Settlement entries**: `excludeFromSpending: 1`, type `splitwise_settlement`, not shown in user-facing income type dropdowns.
- **Category mapping**: Static hardcoded map from Splitwise category names → local `CategoryType`. Unmapped → `OTHER`.
- **Group filtering**: Groups from `/get_groups` filtered to remove `id === 0` (non-group expenses sentinel) and groups where the current user is the only member (or has 0 members).
- **Multi-member splits**: All 4 split types (equal, exact, percentage, shares) work for N people. Form dynamically renders N input rows. Default: all group members when none selected. New `BMultiSelect` UI primitive in `src/components/ui/`.
- **Modal scroll**: `BModal` supports scroll-aware swipe dismissal via `scrollTo`/`scrollOffset`/`scrollOffsetMax` props forwarded to `react-native-modal`. `propagateSwipe` enabled for bottom modals.
- **Add expense carousel UX**: When Splitwise is connected, the Add Expense modal shows two CTAs: primary "Add Expense" (saves directly) and secondary "Split this →" (slides to Step 2 via navigation-push animation). Step 2 is the split configuration. Back button returns to Step 1. No toggle — the carousel is activated by the CTA choice.
- **Transaction detail — retroactive split**: In edit mode on a non-Splitwise expense, a "Split with Splitwise" toggle reveals split config inline. Save = local update + `create_expense` push + create `splitwise_expenses` row. For already-linked expenses, split config is pre-populated and always visible. Save = local update + conflict detect + `update_expense` push. When disconnected, Splitwise fields are visible but locked.
- **Component breakout**: Both `addTransactionModal.tsx` and `transaction-detail.tsx` are refactored into sub-components:

  ```
  src/components/ui/
    multi-select.tsx                  — BMultiSelect primitive

  src/components/splitwise/
    SplitConfig.tsx                   — THE reusable split config (group picker,
                                        member multi-select, split type, per-person amounts)
    SplitwiseConnectionCard.tsx       — existing
    SplitwiseInfoBadge.tsx            — read-only: group name, split summary
    index.ts

  src/components/transaction/
    ExpenseFormFields.tsx             — reusable: amount, category, date, description, credit card
    ImpulseCooldownSection.tsx        — already exists
    transactionCard.tsx               — already exists
    addTransactionModal/
      AddTransactionModal.tsx         — coordinator: carousel state, shared form state
      ExpenseStep.tsx                 — Step 1: ExpenseFormFields + impulse + CTAs
      SplitStep.tsx                   — Step 2: wraps SplitConfig + "Add & Split" CTA
      index.ts
    transactionDetail/
      TransactionDetailScreen.tsx     — coordinator: fetch, view/edit state routing
      ViewMode.tsx                    — read-only display + SplitwiseInfoBadge
      EditMode.tsx                    — ExpenseFormFields + conditional SplitConfig
      useTransactionSave.ts           — save logic: local/linked/unlinked branching
      index.ts
    index.ts

  app/
    transaction-detail.tsx            — thin route wrapper
  ```

- **Chat parity**: Every Splitwise UI action is also a chat intent registered in `chatRegistry.config.ts` and handled in `useMutationMap.ts`.
- **New packages**: `expo-auth-session`, `expo-web-browser` (add to `app.json` plugins).
- **OpenAPI spec**: `assets/json/openapi.json` kept as dev reference, removed after integration is complete.

---

## Phase 1: OAuth Auth & Connection

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to build

An end-to-end OAuth2 PKCE flow that lets users connect and disconnect their Splitwise account from the Settings screen and from chat. On connect, the user taps "Connect Splitwise" in Settings, the OAuth web browser opens, completes the flow, and tokens are stored in `expo-secure-store`. Settings then shows the connected account name and avatar fetched from the Splitwise `/current_user` endpoint. Disconnect clears tokens. Tokens survive app restarts. A 401 during any API call triggers a silent token refresh; if refresh fails, tokens are cleared and a non-blocking "Reconnect Splitwise" prompt is shown. Chat intents `connect_splitwise` and `disconnect_splitwise` provide full parity with the Settings UI.

New modules: `src/services/api/` (generic HTTP client), `src/services/splitwise/auth.ts` (OAuth helpers, token storage, refresh), `src/hooks/useSplitwise.ts` (connection state, connect/disconnect mutations), `src/components/splitwise/SplitwiseConnectionCard.tsx`, `src/constants/splitwise.strings.ts`, `src/constants/splitwise.config.ts`, `src/types/splitwise.ts`.

Modified: `app/dashboard/settings.tsx` (new integrations section), `src/constants/chatRegistry.config.ts` (new intents), `src/hooks/useMutationMap.ts` (new mutations), `src/hooks/index.ts`, `app.json`, `package.json`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] "Connect Splitwise" button appears in Settings → Integrations section
- [x] Tapping it opens the OAuth browser flow via `expo-auth-session`
- [x] On success, tokens stored in `expo-secure-store` and persist across app restarts
- [x] Settings card shows connected account name and avatar from Splitwise `/current_user`
- [x] "Disconnect" button clears tokens and resets the card to the connect state
- [x] A 401 from any Splitwise API call triggers a silent token refresh
- [x] On refresh failure, tokens are cleared and a non-blocking "Reconnect Splitwise" toast/prompt is shown
- [x] Chat intent `connect_splitwise` triggers the OAuth flow from chat
- [x] Chat intent `disconnect_splitwise` clears tokens from chat
- [x] Generic HTTP client in `src/services/api/` is functional with typed errors
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 2: DB Schema & Migration

**User stories**: 8 (schema portion only)

### What to build

Database schema additions and Drizzle migration for all Splitwise data. No sync logic or UI — just the schema. New `splitwise_expenses` table with all fields described in the architectural decisions. New enum values added to `db/types.ts`. Migration generated and verified to run cleanly.

New files: `db/queries/splitwiseExpenses.ts` (CRUD helpers for the new table — insert, upsert by `splitwiseId`, query by `expenseId`).

Modified: `db/schema.ts`, `db/types.ts`, `db/migrations/` (new migration file), `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] `splitwise_expenses` table created with all fields: `id`, `expenseId` (FK), `splitwiseId`, `splitwiseGroupId`, `paidByUserId`, `totalAmount`, `userPaidShare`, `userOwedShare`, `receivableAmount`, `receivableSettled`, `isSettlement`, `splitwiseCategory`, `splitwiseUpdatedAt`, `syncStatus`, `lastSyncedAt`, `createdAt`, `updatedAt`
- [ ] `RecurringSourceTypeEnum.SPLITWISE = 'splitwise'` added to `db/types.ts` _(removed — Splitwise is not a recurring source; identified via FK instead)_
- [x] `IncomeTypeEnum.SPLITWISE_SETTLEMENT = 'splitwise_settlement'` added to `db/types.ts`
- [x] `SPLITWISE_SETTLEMENT` excluded from user-facing income type dropdowns
- [x] `db/queries/splitwiseExpenses.ts` provides typed insert, upsert-by-splitwiseId, and query-by-expenseId helpers
- [x] `pnpm run db:generate` produces a valid migration file
- [x] App starts and migration runs without errors
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 3: Inbound Sync Engine

**User stories**: 8, 9, 10, 11, 12, 13, 14, 15

### What to build

The full sync pipeline: fetching INR expenses from Splitwise, mapping them to local `expenses` + `splitwise_expenses` rows, handling deduplication (upsert by `splitwiseId`), Splitwise badge on `TransactionCard`, stale-gated auto-sync on dashboard mount (>5 min), pull-to-refresh triggering a full re-fetch, category mapping (static Splitwise → local `CategoryType`), and chat intent `sync_splitwise`.

New modules: `src/services/splitwise/sync.ts` (sync orchestration, pagination, 250ms rate-limit delay), `src/services/splitwise/categoryMap.ts` (static mapping), `src/hooks/useSplitwiseSync.ts`.

Modified: `app/dashboard/index.tsx` (stale-gate on mount), `app/all-transactions.tsx` (pull-to-refresh full sync), `src/components/transaction/TransactionCard.tsx` (Splitwise badge), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] Splitwise expenses sync into the local `expenses` table
- [x] Re-syncing updates existing rows (upsert by `splitwiseId`) — no duplicates created
- [x] INR-only: foreign currency expenses are silently skipped
- [x] Synced transactions show a "Splitwise" badge on `TransactionCard`
- [x] Dashboard auto-syncs on mount if last sync was >5 min ago (timestamp in AsyncStorage)
- [x] Pull-to-refresh on all-transactions triggers a full re-fetch (ignores `updated_after`)
- [x] Splitwise categories are mapped to local `CategoryType` via substring matching; unmapped fall back to `OTHER`
- [x] Chat intent `sync_splitwise` triggers a sync and reports results
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 4: Dashboard Balances

**User stories**: 16, 17, 18, 19, 20

### What to build

Splitwise balances integrated into the dashboard hero card. Balance data sourced from the `/get_friends` Splitwise API, cached in AsyncStorage (`SPLITWISE_FRIEND_BALANCES`) with the same 5-min stale threshold as sync. The hero card shows an "in transit" label with `netBalance = totalOwedToYou - totalYouOwe` — green if positive, red if negative, hidden when zero or disconnected. Tapping the "in transit" label navigates to `app/splitwise-balances.tsx`, a friends list screen showing per-friend balances with avatars from Splitwise (`picture.medium`). Chat intent `check_balances` answers per-friend balance queries ("How much does Rohan owe me?").

New modules: `src/components/splitwise/SplitBalancesCard.tsx`, `app/splitwise-balances.tsx`, `src/hooks/useSplitwiseBalances.ts`.

Modified: `app/dashboard/index.tsx` (hero card "in transit" segment), `src/components/dashboard/heroCard.tsx` (net balance display + navigation), `src/constants/splitwise-balances.strings.ts`, `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] Hero card shows "in transit" label with net balance when connected and balance is non-zero
- [x] "In transit" label hidden when disconnected or net balance is zero
- [x] Net balance is green when positive (owed to user), red when negative (user owes)
- [x] Balance sourced from `/get_friends` API, cached in AsyncStorage `SPLITWISE_FRIEND_BALANCES`
- [x] Tapping "in transit" label opens `app/splitwise-balances.tsx` friends list screen
- [x] Friends list shows per-friend balances with avatars from Splitwise
- [x] Chat intent `check_balances` returns per-friend balance (e.g. "Rohan owes you ₹500")
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 5: Outbound Split (MVP)

**User stories**: 26, 28, 29, 30, 31, 32

### What to build

Basic outbound split flow in the Add Expense modal. When Splitwise is connected, a split toggle reveals a `SplitForm` with a groups-first combined picker (`useSplitTargets`) and split type selector supporting all 4 types for 2 people (payer + 1 friend). `group_id` is included in the payload. On submit, the expense is saved locally first regardless of API success. A failed Splitwise push is queued in AsyncStorage (`splitwise_push_queue`) and retried on app open and pull-to-refresh. Two toast states: "offline — will sync later" and "Saved locally. Splitwise sync failed — will retry on next sync." Chat intent `split_expense` handles natural-language split requests.

New modules: `src/components/splitwise/SplitForm.tsx`, `src/hooks/useSplitTargets.ts`, `src/hooks/useSplitExpense.ts`, `src/services/splitwise/push.ts` (outbound push + queue drain), `src/utils/splitwisePushPayload.ts`, `src/types/splitwise-outbound.ts`, `src/validation/splitwisePush.ts`, `src/constants/splitwise-outbound.strings.ts`.

Modified: `src/components/transaction/addTransactionModal.tsx` (split toggle + form), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] When connected, Add Expense modal shows split toggle
- [ ] "Split this →" slides to Step 2 via navigation-push animation _(deferred to Phase 13b)_
- [x] Split toggle hidden when disconnected
- [x] Groups-first combined picker loads friends and groups from Splitwise API
- [x] Groups filtered: `id === 0` removed, single-member / zero-member groups removed
- [ ] `BMultiSelect` component for multi-member selection _(deferred to Phase 13a)_
- [ ] Split types: equal, exact, percentage, shares — all functional for N people _(deferred to Phase 13a — currently 2-person only)_
- [ ] Default: all group members selected when none explicitly chosen _(deferred to Phase 13a)_
- [x] `group_id` included in create expense payload
- [x] Expense saved locally regardless of Splitwise API success
- [x] Failed pushes stored in AsyncStorage queue with `syncStatus: 'push_failed'`
- [x] Queue drained on app open and pull-to-refresh
- [x] "Offline — will sync later" toast shown when device is offline
- [x] "API failed — will retry automatically" toast shown when online but push fails
- [x] Chat intent `split_expense` splits a named expense with a friend
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 6: Receivables Model & Display

**User stories**: 37, 38

### What to build

Wire up the full cash outflow budget model. When a user pays the full amount for a group expense (e.g. ₹1000 for a 50/50 split), the local `expenses.amount` is set to the full ₹1000 and `splitwise_expenses.receivableAmount` is set to ₹500. `receivableAmount` is computed during sync. Transaction detail screen shows "₹1000 paid · ₹500 your share" breakdown. Dashboard hero card "in transit" segment (introduced in Phase 4) is fed by live balance data from the `/get_friends` API.

Modified: `src/services/splitwise/sync.ts` (compute `receivableAmount` on ingest), `app/transaction-detail.tsx` (paid vs. share display), `src/hooks/useSplitwiseReceivables.ts`, `src/hooks/index.ts`.

### Acceptance criteria

- [x] `expenses.amount` for payer = full group expense amount (not just user's share)
- [x] `splitwise_expenses.receivableAmount` = paid share minus owed share when positive
- [x] Transaction detail shows "₹X paid · ₹Y your share" for payer expenses
- [x] Dashboard "in transit" segment reflects live balance data
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 7: Settlement Detection

**User stories**: 39, 40, 41

### What to build

Piggybacking on the existing sync cycle (Phase 3), detect `payment: true` entries from the Splitwise API and process them as settlements instead of regular expenses. For each detected settlement: flip `receivableSettled = 1` on the matching `splitwise_expenses` row, auto-create an `additionalIncome` entry with type `splitwise_settlement` and `excludeFromSpending: 1`, and add a settlement audit trail entry in the transaction list. Handle the pre-install case: if a detected settlement references a Splitwise expense with no matching local row, still log the income entry.

Modified: `src/services/splitwise/sync.ts` (settlement detection branch), `db/queries/splitwiseExpenses.ts` (flip `receivableSettled`), `db/queries/income.ts` (insert settlement income), `src/components/transaction/TransactionCard.tsx` (settlement badge).

### Acceptance criteria

- [x] `payment: true` Splitwise API entries are processed as settlements during sync
- [x] `receivableSettled` flipped to `1` on matching `splitwise_expenses` row
- [x] Income entry auto-created with `type: 'splitwise_settlement'` and `excludeFromSpending: 1`
- [x] Settlement entries appear in transaction list with a settlement badge
- [x] Settlement entries do not affect spending totals
- [x] Pre-install settlements (no local original expense) still create an income entry
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 8: Settlement UI

**User stories**: 42, 43, 44, 45, 46, 47, 48

### What to build

Manual settlement flows for both directions. "Settle up" button (user owes friend) and "Mark as received" button (friend owes user) appear on transaction detail (in `transactionDetail/ViewMode.tsx` once Phase 12 breakout is done, otherwise `app/transaction-detail.tsx`) and the friends list screen (`app/splitwise-balances.tsx`). Both buttons show an IRL warning ("This is ledger-only — make sure you've actually transferred the money"). On confirm: push a `payment: true` entry to Splitwise API, create a local settlement income entry, update `splitwise_expenses` accordingly. Settlement transaction cards support all existing card features (view detail, edit amount). Chat intent `settle_splitwise` handles "Settle up with Rohan" style requests.

New modules: `src/components/splitwise/SettlementButton.tsx`, `src/hooks/useSplitwiseSettlement.ts`.

Modified: `app/transaction-detail.tsx` (or `src/components/transaction/transactionDetail/ViewMode.tsx` after Phase 12) (settle-up / mark-received buttons), `app/splitwise-balances.tsx` (settle-up / mark-received per friend), `src/services/splitwise/push.ts` (settlement push), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [ ] "Settle up" button visible on transaction detail when user owes friend
- [ ] "Mark as received" button visible when friend owes user
- [ ] Both buttons shown per-friend on the balances screen
- [ ] IRL warning dialog shown before confirming either action
- [ ] Settlement pushed to Splitwise API as `payment: true`
- [ ] Local settlement income entry created with `excludeFromSpending: 1`
- [ ] Settlement card supports view detail and edit amount
- [ ] Chat intent `settle_splitwise` resolves "Settle up with [friend]"
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 9: Edit Conflict Resolution

**User stories**: 49, 50, 51, 52, 53

### What to build

Two edit paths based on field type. Local-only fields (category, creditCardId, wasImpulse): write directly to SQLite, no Splitwise API call. Splitwise-relevant fields (amount, date, description, split config): fetch the latest version from Splitwise first via fetch-compare-push flow — compare `splitwiseUpdatedAt`, if the remote was modified since last sync, refresh the edit form with the latest data so the user sees the conflict; if unchanged, push the edits via `POST /update_expense/:id`. User shares are recalculated proportionally when cost changes (`users__N__paid_share`, `users__N__owed_share`). `group_id` is sent in the update payload (sourced from `splitwiseGroupId` on the local row; if null for old data, falls back to `remoteExpense.group_id` from the conflict detection fetch). Local-first save: SQLite is updated immediately, with a best-effort remote push. On remote failure, a warning toast is shown. Splitwise error handling checks `errors` object in the response (200 OK does not mean success). Chat intent `update_splitwise_expense` handles "Update my Splitwise grocery expense to 500" style requests.

Modified: `app/transaction-detail.tsx` (or `src/components/transaction/transactionDetail/EditMode.tsx` + `useTransactionSave.ts` after Phase 12) (field-type routing, local-first save), `src/services/splitwise/sync.ts` (single-expense fetch), `src/services/splitwise/push.ts` (update push with share recalculation, `errors` checking), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`.

### Acceptance criteria

- [x] Editing category/creditCardId/wasImpulse on a synced expense saves locally with no API call
- [x] Editing amount/date/description/split first fetches the latest from Splitwise
- [x] If remote `updatedAt` is newer, edit form refreshes with latest remote data
- [x] If remote is unchanged, edits are pushed via `POST /update_expense/:id`
- [x] User shares recalculated proportionally when cost changes
- [x] `group_id` included in update payload (falls back to remote fetch if local is null)
- [x] Local-first save: SQLite updated immediately, warning toast on remote push failure
- [x] Splitwise `errors` object checked (200 OK does not mean success)
- [x] Splitwise-relevant fields are non-editable when disconnected
- [x] Chat intent `update_splitwise_expense` resolves edit requests
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 10: Onboarding Step

**User stories**: 54, 55, 56

### What to build

A new skippable screen in the existing onboarding flow, inserted between `confirmation` and `success`. The screen offers to connect Splitwise; tapping "Connect" launches the same OAuth flow from Phase 1. Tapping "Skip" advances to `success` with no side effects. On successful connect during onboarding, a fire-and-forget background sync starts immediately so the dashboard has Splitwise data by the time the user reaches it.

New modules: `app/onboarding/splitwise-connect.tsx`.

Modified: `app/onboarding/_layout.tsx` (register new screen), `src/services/splitwise/sync.ts` (background sync trigger), `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [x] New "Connect Splitwise" screen appears between `confirmation` and `success` in onboarding
- [x] "Connect" button launches OAuth flow; on success advances to `success`
- [x] "Skip" button advances to `success` with no side effects
- [x] Background sync fires immediately after connect (fire-and-forget)
- [x] Existing onboarding flow unaffected when skipping
- [x] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 11a: Disconnect Lifecycle

**User stories**: 57, 58, 59, 60, 61, 63

### What to build

Side-effects of disconnecting Splitwise. On disconnect: tokens cleared from Secure Store, outbound push queue flushed (pending pushes abandoned so stale operations aren't retried after reconnection). UI surfaces conditionally hidden: hero card "in transit" label, split CTAs in Add Expense modal, settlement buttons. Previously synced expenses and settlements remain visible in the transaction list with Splitwise badges, but Splitwise-relevant fields are locked (non-editable). The add expense form shows only "Add Expense" (no "Split this →" CTA). Transaction detail for synced expenses shows Splitwise data as read-only with no edit/split actions. Chat intents respond "Connect Splitwise first" when disconnected.

Modified: `src/hooks/useSplitwise.ts` (disconnect side-effects: flush queue, clear tokens), `src/services/splitwise/push.ts` (queue flush function), `app/dashboard/index.tsx` (conditional hero card balance), `src/components/transaction/addTransactionModal.tsx` (or `addTransactionModal/ExpenseStep.tsx` after Phase 12) (conditional split CTAs), `app/transaction-detail.tsx` (or `transactionDetail/EditMode.tsx` after Phase 12) (field lock when disconnected), `src/constants/chatRegistry.config.ts` (disconnected fallback responses), `src/hooks/useMutationMap.ts`.

### Acceptance criteria

- [ ] Disconnect clears tokens and flushes the outbound push queue
- [ ] Previously synced expenses and settlements remain in the transaction list after disconnect
- [ ] Splitwise badges still shown on synced expenses after disconnect
- [ ] Splitwise-relevant fields locked (non-editable) on synced expenses after disconnect
- [ ] Hero card "in transit" label hidden when disconnected
- [ ] Split CTAs hidden in Add Expense modal when disconnected
- [ ] Transaction detail for synced expenses shows Splitwise data read-only, no edit/split actions
- [ ] Add expense form shows only "Add Expense" when disconnected (no "Split this →")
- [ ] Chat intents respond "Connect Splitwise first" when disconnected
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 11b: Offline Resilience & Reconnect

**User stories**: 62, 64

### What to build

Offline detection and reconnection handling. All local features work normally when the device is offline — no crashes or blocked UI. When a Splitwise action is attempted without connectivity, a non-blocking "offline" toast is shown. On reconnect after a disconnection period: `lastSyncedAt` is reset and a full sync (not incremental) runs immediately to catch any missed updates.

Modified: `src/services/splitwise/sync.ts` (full sync on reconnect, `lastSyncedAt` reset), `src/hooks/useSplitwise.ts` (reconnect detection), `src/hooks/useSplitwiseSync.ts` (full sync trigger), `src/services/splitwise/push.ts` (offline guard with toast).

### Acceptance criteria

- [ ] All local features work normally when offline (no crashes, no blocked UI)
- [ ] Non-blocking "offline" toast shown when a Splitwise action is attempted without connectivity
- [ ] On reconnect, `lastSyncedAt` is reset and a full sync (not incremental) runs
- [ ] Full sync catches all updates missed during disconnection
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 12: Component Breakout & Shared Components

**User stories**: 67, 68, 69

### What to build

Pure structural refactoring — no new features. Break the monolithic `addTransactionModal.tsx` and `transaction-detail.tsx` into focused sub-components. Extract shared form fields. Create the `BMultiSelect` UI primitive. Create `SplitConfig` (replaces `SplitForm`) and `SplitwiseInfoBadge`. All existing behavior must be preserved exactly.

**Add Expense Modal breakout** — `src/components/transaction/addTransactionModal/`:

- `AddTransactionModal.tsx` — coordinator: shared form state, split toggle state.
- `ExpenseStep.tsx` — wraps `ExpenseFormFields` + `ImpulseCooldownSection` + CTAs.
- `SplitStep.tsx` — wraps `SplitConfig` + "Add & Split" CTA + back button (carousel wiring deferred to Phase 13b).
- `index.ts` — barrel export.

**Transaction Detail breakout** — `src/components/transaction/transactionDetail/`:

- `TransactionDetailScreen.tsx` — coordinator: data fetch, view/edit state routing.
- `ViewMode.tsx` — read-only display + `SplitwiseInfoBadge` (group name, split summary) for linked expenses.
- `EditMode.tsx` — `ExpenseFormFields` + conditional split config area. Retroactive split wiring deferred to Phase 14.
- `useTransactionSave.ts` — save logic: branches for local-only, linked (update remote), and unlinked.
- `index.ts` — barrel export.

**Shared components**:

- `src/components/transaction/ExpenseFormFields.tsx` — reusable form fields (amount, category, date, description, credit card) extracted from the modal and detail screen.
- `src/components/splitwise/SplitConfig.tsx` — replaces old `SplitForm.tsx`. Group picker, member picker (single-select for now — upgraded to multi-select in Phase 13a), split type selector, per-person amount inputs.
- `src/components/splitwise/SplitwiseInfoBadge.tsx` — read-only badge for `ViewMode`: shows group name and split summary.
- `src/components/ui/multi-select.tsx` — `BMultiSelect` UI primitive.

Updated: `app/transaction-detail.tsx` becomes a thin route wrapper delegating to `TransactionDetailScreen`. Barrel exports updated. `docs/FOLDER_STRUCTURE.md` updated.

### Acceptance criteria

- [ ] `addTransactionModal.tsx` refactored into `addTransactionModal/` folder with `AddTransactionModal.tsx`, `ExpenseStep.tsx`, `SplitStep.tsx`, `index.ts`
- [ ] `transaction-detail.tsx` refactored into `transactionDetail/` folder with `TransactionDetailScreen.tsx`, `ViewMode.tsx`, `EditMode.tsx`, `useTransactionSave.ts`, `index.ts`
- [ ] `ExpenseFormFields.tsx` extracted and shared between modal and detail
- [ ] `SplitConfig.tsx` replaces `SplitForm.tsx` as the single reusable split configuration component
- [ ] `SplitwiseInfoBadge.tsx` created for read-only split display in `ViewMode`
- [ ] `BMultiSelect` in `src/components/ui/multi-select.tsx` is a proper B\* primitive
- [ ] `app/transaction-detail.tsx` is a thin route wrapper only
- [ ] All existing behavior preserved — no regressions
- [ ] All barrel exports updated (`src/components/transaction/index.ts`, `src/components/splitwise/index.ts`)
- [ ] `docs/FOLDER_STRUCTURE.md` updated to reflect new directory structure
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 13a: BMultiSelect & N-Person Splits

**User stories**: 24, 25, 27, 69

### What to build

Upgrade `SplitConfig` from 2-person splits to N-person splits. Integrate `BMultiSelect` into the group member picker so users can select multiple members within a group. When no members are explicitly selected, default to all group members. All 4 split types (equal, exact, percentage, shares) must work for N people — the form dynamically renders input rows per selected member. Group filtering improvements: remove `id === 0` sentinel and groups where the current user is the only member.

Modified: `src/components/splitwise/SplitConfig.tsx` (multi-member selection via `BMultiSelect`, N-person split type inputs), `src/utils/splitwisePushPayload.ts` (N-person payload building), `src/types/splitwise-outbound.ts` (SplitFormState updated for N members).

### Acceptance criteria

- [ ] `SplitConfig` uses `BMultiSelect` for group member selection
- [ ] Multiple members can be selected within a group
- [ ] Default: all group members selected when none explicitly chosen
- [ ] Members not included in the split silently excluded (`owed_share` set to `0`)
- [ ] Split types: equal, exact, percentage, shares — all functional for N people
- [ ] Form dynamically renders N input rows per selected member
- [ ] Group filtering: `id === 0` removed, single-member / zero-member groups removed
- [ ] Push payload correctly built for N-person splits
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 13b: Carousel UX

**User stories**: 21, 22, 33, 65, 66

### What to build

Replace the split toggle in the Add Expense modal with a two-CTA layout and carousel navigation. The expense form shows two CTAs: primary "Add Expense" (saves directly) and secondary "Split this →" (enters split config). "Split this →" pushes to Step 2 (`SplitStep`) via a navigation-push style slide animation, giving the split form its own focused space. A back CTA returns to Step 1. Navigating back auto-resets all split state (friendId, groupId, split type, amounts) so stale data doesn't persist. `SplitConfig` is used in `SplitStep` as the reusable split configuration component.

Modified: `src/components/transaction/addTransactionModal/AddTransactionModal.tsx` (carousel state, navigation-push animation between ExpenseStep and SplitStep), `src/components/transaction/addTransactionModal/ExpenseStep.tsx` (two CTAs: "Add Expense" + "Split this →"), `src/components/transaction/addTransactionModal/SplitStep.tsx` (wraps SplitConfig + "Add & Split" CTA + back button).

### Acceptance criteria

- [ ] Two CTAs visible: "Add Expense" (local-only save) and "Split this →" (enters split config)
- [ ] "Split this →" hidden when Splitwise is disconnected
- [ ] Tapping "Split this →" slides to Step 2 via navigation-push animation
- [ ] Step 2 shows `SplitConfig` with "Add & Split" CTA and back button
- [ ] Back button returns to Step 1 with auto-reset of all split state
- [ ] "Add & Split" saves locally + pushes to Splitwise
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 14: Retroactive Split from Transaction Detail

**User stories**: 34, 35, 36

### What to build

Add a "Split with Splitwise" action on transaction detail for local (non-Splitwise) expenses. In edit mode on an unlinked expense, a toggle reveals the `SplitConfig` component inline. On save: local expense is updated, a new expense is pushed to Splitwise via `create_expense`, a `splitwise_expenses` row is created linking the local expense to the returned Splitwise ID, and the local expense's `sourceType` is updated to `'splitwise'`. For already-linked expenses, the split config is pre-populated and always visible — save triggers the conflict detection + `update_expense` push flow from Phase 9. The retroactive split action is hidden when Splitwise is disconnected or when the expense already has a `splitwise_expenses` row.

Modified: `src/components/transaction/transactionDetail/EditMode.tsx` (retroactive split toggle + SplitConfig), `src/components/transaction/transactionDetail/useTransactionSave.ts` (unlinked-with-new-split branch: create remote + link local), `src/services/splitwise/push.ts` (create expense for retroactive split).

### Acceptance criteria

- [ ] "Split with Splitwise" toggle visible in edit mode for unlinked (non-Splitwise) expenses
- [ ] Toggle hidden when Splitwise is disconnected
- [ ] Toggle hidden when expense already has a `splitwise_expenses` row
- [ ] Toggling on reveals `SplitConfig` inline
- [ ] Save creates remote Splitwise expense + local `splitwise_expenses` row + updates `sourceType`
- [ ] For linked expenses, split config is pre-populated and always visible
- [ ] Save on linked expenses triggers conflict detection + `update_expense` push
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors
