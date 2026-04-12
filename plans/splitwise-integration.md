# Plan: Splitwise Integration

> Source PRD: [smgrv123/budgetmybs#35](https://github.com/smgrv123/budgetmybs/issues/35)

## Architectural Decisions

Durable decisions that apply across all phases:

- **OAuth**: Authorization Code flow with PKCE via `expo-auth-session`. Deep link `budgetmybs://auth/splitwise`. Client secret in `EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET` (on-device, MVP tradeoff — flagged for proxy migration).
- **Token storage**: `expo-secure-store`. Silent refresh on 401. On refresh failure: clear tokens, surface non-blocking "Reconnect Splitwise" prompt.
- **API client**: Generic typed HTTP client in `src/services/api/` (fetch-based, not Splitwise-specific). Exposes `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`. Auth via `AuthProvider` interface. Handles retry (2–3 attempts), timeout, rate-limit delay, typed errors (`NetworkError`, `AuthError`, `RateLimitError`, `ApiError`).
- **Splitwise API layer**: `src/services/splitwise/` — thin typed wrappers over the Splitwise REST API, no third-party SDK. Consumes generic HTTP client.
- **Schema**: New `splitwise_expenses` table (FK → `expenses.id`). New enum values on `db/types.ts`: `RecurringSourceTypeEnum.SPLITWISE`, `IncomeTypeEnum.SPLITWISE_SETTLEMENT`.
- **Offline-first**: All writes go to SQLite first. Splitwise API push is a side-effect that can fail. Failed pushes queued in AsyncStorage (same pattern as `impulseAsyncStore.ts`). Queue drained on app open and pull-to-refresh.
- **Sync model**: Auto-sync on dashboard mount if stale >5 min (timestamp in AsyncStorage `SPLITWISE_LAST_SYNCED_AT`). Incremental by default (`updated_after`). Pull-to-refresh = full re-fetch (up to 200 INR expenses). 250ms delay between sequential API calls.
- **Currency**: INR-only. Foreign currency expenses silently skipped.
- **Budget model**: Full cash outflow — when user pays ₹1000 for a 50/50 split, budget drops ₹1000 (not ₹500). Receivable displayed as "in transit."
- **Settlement entries**: `excludeFromSpending: 1`, type `splitwise_settlement`, not shown in user-facing income type dropdowns.
- **Category mapping**: Static hardcoded map from Splitwise category names → local `CategoryType`. Unmapped → `OTHER`.
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

A balances card on the dashboard showing "You are owed ₹X" and "You owe ₹X" totals. Card is hidden when Splitwise is not connected or both balances are zero. Tapping the card navigates to a friends list screen showing per-friend balances. The budget progress bar gains a green "in transit" segment representing the total receivable amount. Chat intent `check_balances` answers per-friend balance queries ("How much does Rohan owe me?").

New modules: `src/components/splitwise/SplitBalancesCard.tsx`, `app/splitwise-balances.tsx`, `src/hooks/useSplitwiseBalances.ts`.

Modified: `app/dashboard/index.tsx` (balances card + progress bar segment), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [ ] Balances card visible on dashboard when connected and at least one balance is non-zero
- [ ] Card hidden when disconnected or both balances are zero
- [ ] Card shows correct "You are owed" and "You owe" totals
- [ ] Tapping card opens friends list screen with per-friend balances
- [ ] Budget progress bar shows a green "in transit" segment for total receivable amount
- [ ] Chat intent `check_balances` returns per-friend balance (e.g. "Rohan owes you ₹500")
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 5: Outbound Split

**User stories**: 21, 22, 23, 24, 25, 26, 27, 28

### What to build

A "Split with Splitwise" toggle on the expense form. When enabled, a `SplitForm` appears to pick a friend or group and choose a split type (equal, exact, percentage, shares). On submit, the expense is saved locally first regardless of API success. A failed Splitwise push is queued in AsyncStorage (`splitwise_push_queue`) and retried on app open and pull-to-refresh. Two toast states: "offline — will sync later" and "online but API failed — will retry automatically." Chat intent `split_expense` handles natural-language split requests ("Split my last dinner with Priya equally"). `useSplitTargets` hook fetches friends and groups for the picker.

New modules: `src/components/splitwise/SplitForm.tsx`, `src/hooks/useSplitTargets.ts`, `src/services/splitwise/push.ts` (outbound push + queue drain).

Modified: `src/components/transaction/addTransactionModal.tsx` (split toggle + SplitForm), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [ ] "Split with Splitwise" toggle visible on expense form when connected
- [ ] Toggle hidden when disconnected
- [ ] Friend/group picker loads from Splitwise API
- [ ] Split types: equal, exact, percentage, shares — all functional
- [ ] Expense saved locally regardless of Splitwise API success
- [ ] Failed pushes stored in AsyncStorage queue with `syncStatus: 'push_failed'`
- [ ] Queue drained on app open and pull-to-refresh
- [ ] "Offline — will sync later" toast shown when device is offline
- [ ] "API failed — will retry automatically" toast shown when online but push fails
- [ ] Chat intent `split_expense` splits a named expense with a friend
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 6: Receivables Model & Display

**User stories**: 29, 30

### What to build

Wire up the full cash outflow budget model. When a user pays the full amount for a group expense (e.g. ₹1000 for a 50/50 split), the local `expenses.amount` is set to the full ₹1000 and `splitwise_expenses.receivableAmount` is set to ₹500. Transaction detail screen shows "₹1000 paid · ₹500 your share." Dashboard progress bar "in transit" segment (introduced in Phase 4) is now fed by live `receivableAmount` data from `splitwise_expenses`.

Modified: `src/services/splitwise/sync.ts` (compute `receivableAmount` on ingest), `app/transaction-detail.tsx` (paid vs. share display), `src/hooks/useSplitwiseReceivables.ts`, `src/hooks/index.ts`.

### Acceptance criteria

- [ ] `expenses.amount` for payer = full group expense amount (not just user's share)
- [ ] `splitwise_expenses.receivableAmount` = paid share minus owed share when positive
- [ ] Transaction detail shows "₹X paid · ₹Y your share" for payer expenses
- [ ] Dashboard "in transit" segment reflects sum of unsettled `receivableAmount` values
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 7: Settlement Detection

**User stories**: 31, 32, 33

### What to build

Piggybacking on the existing sync cycle (Phase 3), detect `payment: true` entries from the Splitwise API and process them as settlements instead of regular expenses. For each detected settlement: flip `receivableSettled = 1` on the matching `splitwise_expenses` row, auto-create an `additionalIncome` entry with type `splitwise_settlement` and `excludeFromSpending: 1`, and add a settlement audit trail entry in the transaction list. Handle the pre-install case: if a detected settlement references a Splitwise expense with no matching local row, still log the income entry.

Modified: `src/services/splitwise/sync.ts` (settlement detection branch), `db/queries/splitwiseExpenses.ts` (flip `receivableSettled`), `db/queries/income.ts` (insert settlement income), `src/components/transaction/TransactionCard.tsx` (settlement badge).

### Acceptance criteria

- [ ] `payment: true` Splitwise API entries are processed as settlements during sync
- [ ] `receivableSettled` flipped to `1` on matching `splitwise_expenses` row
- [ ] Income entry auto-created with `type: 'splitwise_settlement'` and `excludeFromSpending: 1`
- [ ] Settlement entries appear in transaction list with a settlement badge
- [ ] Settlement entries do not affect spending totals
- [ ] Pre-install settlements (no local original expense) still create an income entry
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 8: Settlement UI

**User stories**: 34, 35, 36, 37, 38, 39, 40

### What to build

Manual settlement flows for both directions. "Settle up" button (user owes friend) and "Mark as received" button (friend owes user) appear on transaction detail and the friends list screen from Phase 4. Both buttons show an IRL warning ("This is ledger-only — make sure you've actually transferred the money"). On confirm: push a `payment: true` entry to Splitwise API, create a local settlement income entry, update `splitwise_expenses` accordingly. Settlement transaction cards support all existing card features (view detail, edit amount). Chat intent `settle_splitwise` handles "Settle up with Rohan" style requests.

New modules: `src/components/splitwise/SettlementButton.tsx`, `src/hooks/useSplitwiseSettlement.ts`.

Modified: `app/transaction-detail.tsx` (settle-up / mark-received buttons), `app/splitwise-balances.tsx` (settle-up / mark-received per friend), `src/services/splitwise/push.ts` (settlement push), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`, `src/hooks/index.ts`, `docs/FOLDER_STRUCTURE.md`.

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

**User stories**: 41, 42, 43, 44, 45

### What to build

Two edit paths based on field type. Local-only fields (category, creditCardId, wasImpulse): write directly to SQLite, no Splitwise API call. Splitwise-relevant fields (amount, date, description, split config): fetch the latest version from Splitwise first, compare `splitwiseUpdatedAt` — if the remote was modified since last sync, refresh the edit form with the latest data so the user sees the conflict; if unchanged, push the edits to Splitwise after the user confirms. Chat intent `update_splitwise_expense` handles "Update my Splitwise grocery expense to 500" style requests.

Modified: `app/transaction-detail.tsx` (field-type routing), `src/services/splitwise/sync.ts` (single-expense fetch), `src/constants/chatRegistry.config.ts`, `src/hooks/useMutationMap.ts`.

### Acceptance criteria

- [ ] Editing category/creditCardId/wasImpulse on a synced expense saves locally with no API call
- [ ] Editing amount/date/description/split first fetches the latest from Splitwise
- [ ] If remote `updatedAt` is newer, edit form refreshes with latest remote data
- [ ] If remote is unchanged, edits are pushed to Splitwise on confirm
- [ ] Splitwise-relevant fields are non-editable when disconnected
- [ ] Chat intent `update_splitwise_expense` resolves edit requests
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 10: Onboarding Step

**User stories**: 46, 47, 48

### What to build

A new skippable screen in the existing onboarding flow, inserted between `confirmation` and `success`. The screen offers to connect Splitwise; tapping "Connect" launches the same OAuth flow from Phase 1. Tapping "Skip" advances to `success` with no side effects. On successful connect during onboarding, a fire-and-forget background sync starts immediately so the dashboard has Splitwise data by the time the user reaches it.

New modules: `app/onboarding/splitwise-connect.tsx`.

Modified: `app/onboarding/_layout.tsx` (register new screen), `src/services/splitwise/sync.ts` (background sync trigger), `docs/FOLDER_STRUCTURE.md`.

### Acceptance criteria

- [ ] New "Connect Splitwise" screen appears between `confirmation` and `success` in onboarding
- [ ] "Connect" button launches OAuth flow; on success advances to `success`
- [ ] "Skip" button advances to `success` with no side effects
- [ ] Background sync fires immediately after connect (fire-and-forget)
- [ ] Existing onboarding flow unaffected when skipping
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors

---

## Phase 11: Disconnection & Error Hardening

**User stories**: 49, 50, 51, 52, 53, 54, 55

### What to build

Full hardening of the disconnection lifecycle and offline resilience. On disconnect: tokens cleared, outbound push queue flushed (pending pushes abandoned), balances card hidden, split toggle hidden, previously synced expenses and settlements remain visible with badges but Splitwise-relevant fields locked for editing. Chat intents respond "Connect Splitwise first" when disconnected. On reconnect: `lastSyncedAt` reset, full sync (not incremental) runs immediately. All local features work normally when offline; a non-blocking "offline" toast is shown when a Splitwise action is attempted without connectivity.

Modified: `src/hooks/useSplitwise.ts` (disconnect side-effects), `src/services/splitwise/push.ts` (queue flush on disconnect), `app/dashboard/index.tsx` (conditional balances card), `src/components/transaction/addTransactionModal.tsx` (conditional split toggle), `app/transaction-detail.tsx` (field lock when disconnected), `src/constants/chatRegistry.config.ts` (disconnected fallback responses), `src/hooks/useMutationMap.ts`, `src/services/splitwise/sync.ts` (full sync on reconnect).

### Acceptance criteria

- [ ] Disconnect clears tokens and flushes the outbound push queue
- [ ] Previously synced expenses and settlements remain in the transaction list after disconnect
- [ ] Splitwise badges still shown on synced expenses after disconnect
- [ ] Splitwise-relevant fields locked (non-editable) on synced expenses after disconnect
- [ ] Balances card hidden when disconnected
- [ ] Split toggle hidden when disconnected
- [ ] Chat intents respond "Connect Splitwise first" when disconnected
- [ ] On reconnect, `lastSyncedAt` is reset and a full sync (not incremental) runs
- [ ] All local features work normally when offline
- [ ] Non-blocking "offline" toast shown when a Splitwise action is attempted without connectivity
- [ ] `pnpm run lint` and `pnpm run typecheck` pass with no errors
