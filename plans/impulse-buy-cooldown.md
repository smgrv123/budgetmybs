# Plan: Impulse Buy Cooldown Reminder Flow

> Source PRD: [GitHub Issue #33](https://github.com/smgrv123/budgetmybs/issues/33)

## Architectural Decisions

Durable decisions that apply across all phases:

- **Storage**: Pending impulse purchases stored in AsyncStorage under a dedicated key registered in `asyncStorageKeys.ts`. Permission ask counter also in AsyncStorage. Only written to the `expensesTable` (with `wasImpulse: 1`) upon user confirmation.
- **Schema**: No migration needed — reuses the existing `was_impulse` column in `expensesTable`.
- **Notification category**: New Expo Notifications category (e.g. `impulse-reminder`) with `Confirm` and `Skip` action buttons, registered at app startup.
- **Route**: New screen `app/impulse-confirm.tsx` for the in-app confirmation flow (notification body tap + app-open expired list).
- **Chat intent**: New `ChatIntentEnum` entry for impulse purchases, following the existing declarative registry pattern.
- **Filter**: Extend existing `ExpenseFilter` type with a `wasImpulse` option.
- **Strings**: All user-facing text in a dedicated strings constants file, per project convention.
- **Components**: All UI built with B* components, theme tokens, no raw styles.

---

## Phase 1: Impulse Store + Direct Override Path

**User stories**: 1, 2, 11, 21

### What to build

Add an impulse toggle to the existing add-transaction modal. When toggled on, show a disclaimer explaining the cooldown flow, timer preset chips (10 min, 30 min, 1 hr, 2 hr, 5 hr, 1 day, custom), and a number + unit picker for custom durations. Below the disclaimer, show an override link ("Already purchased? Log it now") that saves the expense directly to the database with `wasImpulse: 1`, bypassing the notification flow entirely.

Build an AsyncStorage-backed impulse store module with a clean interface (`save`, `getAll`, `getExpired`, `remove`) for managing pending impulse purchases. Each pending entry stores: purchase data (amount, category, description, credit card, date), selected cooldown duration, expiry timestamp, and a placeholder for notification ID (used in Phase 2B).

When the user submits with the impulse toggle on (and NOT using the override), save to AsyncStorage via the impulse store. The notification scheduling comes in Phase 2B — for now, the purchase is simply persisted as pending.

The submit button text does NOT change. The disclaimer and override within it communicate the behavioral difference.

### Acceptance criteria

- [ ] Impulse toggle appears in the add-transaction modal
- [ ] Toggling on reveals: disclaimer text, timer preset chips, custom duration picker
- [ ] Preset chips: 10 min, 30 min, 1 hr, 2 hr, 5 hr, 1 day — single select
- [ ] Custom option opens a number + unit picker (minutes / hours / days)
- [ ] Disclaimer explains that the purchase will be held and a reminder sent after the selected time
- [ ] "Already purchased? Log it now" override saves to DB with `wasImpulse: 1` immediately
- [ ] Non-override submit saves the pending purchase to AsyncStorage via the impulse store
- [ ] Pending purchases survive app restarts (AsyncStorage persistence verified)
- [ ] Impulse store exposes `save`, `getAll`, `getExpired`, `remove` interface
- [ ] All strings in a constants file, all UI uses B* components and theme tokens
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 2A: Permission Gating + Timer Selection

**User stories**: 12, 13, 14

### What to build

Build a notification permission tracker backed by AsyncStorage that counts how many times the impulse toggle has been activated. On the 1st, 3rd, and 10th activation, prompt the user for notification permissions. After the 10th, never ask again.

Wire this into the impulse toggle in the transaction modal: when the user flips the toggle on, check permissions and potentially prompt. If permissions are granted, proceed normally (disclaimer + timer UI). If denied, the toggle stays on but the disclaimer changes to a different warning explaining that notifications are off and the purchase will be logged directly with the impulse flag. In that case, submit writes to DB with `wasImpulse: 1` (no AsyncStorage, no notification).

### Acceptance criteria

- [ ] Permission ask counter persisted in AsyncStorage
- [ ] Permission prompt fires on the 1st, 3rd, and 10th impulse toggle activation, then never
- [ ] If permission granted: normal impulse flow (disclaimer + timer + AsyncStorage)
- [ ] If permission denied: toggle stays on, warning changes, submit logs directly to DB with `wasImpulse: 1`
- [ ] Counter increments regardless of grant/deny outcome
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 2B: Notification Scheduling

**User stories**: 3, 4, 5

### What to build

Register a new Expo Notifications category with two action buttons: Confirm and Skip. This category must be registered at app startup (in the root layout or notification service initialization).

When the user submits an impulse purchase with notifications enabled, schedule a local push notification using the selected cooldown duration (`now + duration`). The notification content should include the purchase description and amount. Store the returned notification ID alongside the pending purchase in AsyncStorage so it can be referenced later.

### Acceptance criteria

- [ ] Notification category with Confirm and Skip actions registered at app startup
- [ ] Impulse submit (with permissions) schedules a local notification at `now + selected cooldown`
- [ ] Notification content includes purchase description and amount
- [ ] Notification ID stored in AsyncStorage with the pending purchase entry
- [ ] Notifications work on both iOS and Android
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 2C: Notification Response Handling

**User stories**: 6, 8, 9

### What to build

Handle the three notification interaction scenarios:

1. **Confirm action button**: Read the pending purchase from AsyncStorage, write it to the database as a new expense with `wasImpulse: 1`, then remove it from AsyncStorage.
2. **Skip action button**: Remove the pending purchase from AsyncStorage. No database write, no record kept.
3. **Notification body tap**: Handled in Phase 3 (for now, opens the app normally).

Wire the response handling into the existing notification response listener infrastructure.

### Acceptance criteria

- [ ] Tapping Confirm on notification → expense created in DB with `wasImpulse: 1`, cleared from AsyncStorage
- [ ] Tapping Skip on notification → cleared from AsyncStorage, no DB entry
- [ ] Response handling integrates with the existing notification listener pattern
- [ ] Edge case: if the pending purchase was already handled (e.g. via app-open check), gracefully no-op
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 3: Confirmation Screen + App-Open Check

**User stories**: 7, 10

### What to build

Create a new screen at `app/impulse-confirm.tsx`. This screen serves two purposes:

1. **Single purchase confirmation** (from notification body tap): Receives a pending purchase ID via route params, displays the purchase details, and offers Confirm / Skip actions.
2. **Expired purchase list** (from app-open check): Displays all pending impulse purchases whose cooldown has expired, each with Confirm / Skip actions.

Build an app-open hook that runs when the app becomes active. It queries the impulse store for expired pending purchases. If any exist, navigate to the confirmation screen in list mode. Mount this hook alongside the existing app-open logic.

Update the notification body tap handler to navigate to this screen with the specific purchase ID.

### Acceptance criteria

- [ ] New `impulse-confirm` screen exists and is navigable
- [ ] Single-purchase mode: shows purchase details with Confirm and Skip buttons
- [ ] List mode: shows all expired pending purchases, each with Confirm and Skip
- [ ] Confirm → writes to DB with `wasImpulse: 1`, removes from AsyncStorage
- [ ] Skip → removes from AsyncStorage
- [ ] App-open hook detects expired pending purchases and navigates to list mode
- [ ] Notification body tap navigates to single-purchase mode
- [ ] Handles empty state gracefully (no expired purchases → no navigation)
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 4A: Chat Intent — Direct Impulse Logging

**User stories**: 15, 16

### What to build

Add a new chat intent entry to the chat registry for direct impulse logging. This handles the case where the user describes a purchase they already made in past tense (e.g. "I just impulse bought shoes for 2000").

The AI system prompt must be updated to detect impulse intent from natural language. When past tense is detected, the intent maps to direct database creation with `wasImpulse: 1`. The intent follows the same declarative registry pattern as existing intents: field configs, Zod validation, mutation with `transformData`, query invalidations.

### Acceptance criteria

- [ ] New chat intent registered for direct impulse expense logging
- [ ] AI detects past-tense impulse language and routes to this intent
- [ ] Expense saved to DB with `wasImpulse: 1` via the existing mutation infrastructure
- [ ] Same fields as normal expense intent (amount, category, description, credit card)
- [ ] Follows existing registry pattern (fields, validation, mutations, invalidations)
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 4B: Chat Intent — Cooldown Flow

**User stories**: 17, 18, 19

### What to build

Extend the chat impulse handling for present/future tense ("I want to buy", "I'm tempted to get"). When the AI detects this intent:

1. Parse cooldown duration from the message if provided (e.g. "remind me in 2 hours").
2. If not provided, the AI asks a follow-up question for the duration.
3. Save to AsyncStorage via the impulse store and schedule a notification — same flow as the modal.

Apply the same notification permission cadence (1st/3rd/10th) and fallback behavior (direct logging with warning when denied) as the modal path.

### Acceptance criteria

- [ ] AI detects present/future tense impulse language and routes to cooldown flow
- [ ] Timer duration parsed from message when provided
- [ ] AI asks follow-up for duration when not specified
- [ ] Pending purchase saved to AsyncStorage + notification scheduled
- [ ] Same permission cadence and denied-fallback as modal
- [ ] `pnpm run lint`, `pnpm run typecheck` pass

---

## Phase 5: Transaction List Filter

**User stories**: 20, 22

### What to build

Add an impulse purchase filter to the all-transactions screen. Extend the existing `ExpenseFilter` type to include an impulse flag. Add a corresponding option in the filter modal so users can filter to show only impulse purchases. The existing transaction detail impulse badge continues working as-is (no changes needed).

### Acceptance criteria

- [ ] `ExpenseFilter` type extended with impulse filter option
- [ ] Filter modal includes an impulse purchase toggle/option
- [ ] Filtering by impulse shows only transactions with `wasImpulse: 1`
- [ ] Active filter chip displayed when impulse filter is active
- [ ] Existing transaction detail impulse badge unaffected
- [ ] `pnpm run lint`, `pnpm run typecheck` pass
