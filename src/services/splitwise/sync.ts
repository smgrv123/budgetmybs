/**
 * Splitwise Inbound Sync Engine
 *
 * Fetches INR expenses from the Splitwise API, maps them to local
 * `expenses` + `splitwise_expenses` rows, and upserts by splitwiseId.
 *
 * Sync modes:
 *   - Incremental (default): fetches expenses updated since lastSyncedAt.
 *   - Full sync: fetches all INR expenses (up to SPLITWISE_SYNC_EXPENSE_LIMIT).
 *
 * Rules:
 *   - Settlements (payment: true) create income entries and mark receivables settled.
 *   - Deleted expenses (deleted_at non-null) are skipped.
 *   - Non-INR expenses are silently skipped.
 *   - 250 ms delay between API calls.
 *   - Updates SPLITWISE_LAST_SYNCED_AT in AsyncStorage on success.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';

import {
  getAllCategories,
  createExpense,
  createIncome,
  updateExpense,
  upsertSplitwiseExpense,
  getSplitwiseExpenseBySplitwiseId,
  getUnsettledReceivablesByPaidByUser,
  markReceivableSettledBySplitwiseId,
} from '@/db';
import { CategoryTypeEnum, IncomeTypeEnum } from '@/db/types';
import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import {
  SPLITWISE_API_BASE_URL,
  SPLITWISE_API_CALL_DELAY_MS,
  SPLITWISE_SYNC_EXPENSE_LIMIT,
  SPLITWISE_SYNC_ENDPOINTS,
  SPLITWISE_USER_ID_KEY,
} from '@/src/constants/splitwise.config';
import { SPLITWISE_STRINGS } from '@/src/constants/splitwise.strings';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import { mapSplitwiseCategoryToLocal } from '@/src/services/splitwise/categoryMap';
import { ensureNetworkAvailable } from '@/src/utils/network';
import type {
  SplitwiseExpensesResponse,
  SplitwiseExpenseData,
  SplitwiseCurrentUserApiResponse,
  SplitwiseSingleExpenseResponse,
  SplitwiseUpdateExpenseResponse,
  SplitwiseFriendsWithBalanceResponse,
} from '@/src/validation/splitwise';
import type { SplitwiseFriendBalanceEntry, SplitwiseSyncResult } from '@/src/types/splitwise';

// ============================================
// HELPERS
// ============================================

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch (and cache) the local Splitwise user ID.
 * First checks SecureStore; if absent, fetches /get_current_user.
 */
const getLocalSplitwiseUserId = async (client: ReturnType<typeof createHttpClient>): Promise<number | null> => {
  const cached = await SecureStore.getItemAsync(SPLITWISE_USER_ID_KEY);
  if (cached) {
    const parsed = parseInt(cached, 10);
    return isNaN(parsed) ? null : parsed;
  }

  try {
    const { user } = await client.get<SplitwiseCurrentUserApiResponse>(SPLITWISE_SYNC_ENDPOINTS.CURRENT_USER);
    await SecureStore.setItemAsync(SPLITWISE_USER_ID_KEY, String(user.id));
    return user.id;
  } catch (err) {
    console.error('[splitwise/sync] Failed to fetch current user:', err);
    return null;
  }
};

// ============================================
// CORE SYNC FUNCTION
// ============================================

/**
 * Sync Splitwise INR expenses into the local database.
 *
 * @param options.fullSync - When true, ignores updated_after and fetches all expenses.
 * @returns Summary of how many expenses were synced, skipped, or failed.
 */
export const syncSplitwiseExpenses = async (options: { fullSync?: boolean } = {}): Promise<SplitwiseSyncResult> => {
  await ensureNetworkAvailable();

  const result: SplitwiseSyncResult = { synced: 0, skipped: 0, errors: 0, settlements: 0 };

  const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });

  // ── Resolve local Splitwise user ID ─────────────────────────────────────
  const localUserId = await getLocalSplitwiseUserId(client);
  if (localUserId === null) {
    throw new Error('[splitwise/sync] Could not determine local Splitwise user ID. Is the account connected?');
  }

  await delay(SPLITWISE_API_CALL_DELAY_MS);

  // ── Fetch expenses from API ──────────────────────────────────────────────
  const lastSyncedAt = await AsyncStorage.getItem(AsyncStorageKeys.SPLITWISE_LAST_SYNCED_AT);

  const queryParams: Record<string, string> = {
    limit: String(SPLITWISE_SYNC_EXPENSE_LIMIT),
    currency_code: 'INR',
  };

  if (!options.fullSync && lastSyncedAt) {
    queryParams.updated_after = lastSyncedAt;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  const expensesUrl = `${SPLITWISE_SYNC_ENDPOINTS.GET_EXPENSES}?${queryString}`;

  const { expenses } = await client.get<SplitwiseExpensesResponse>(expensesUrl);

  // ── Pre-load all categories once ────────────────────────────────────────
  const allCategories = await getAllCategories();
  const categoryByType = new Map(allCategories.map((c) => [c.type, c]));

  // ── Process each expense ─────────────────────────────────────────────────
  for (const expense of expenses) {
    try {
      const skipResult = shouldSkipExpense(expense);
      if (skipResult) {
        result.skipped++;
        continue;
      }

      // Find user's share entry
      const userEntry = expense.users.find((u) => u.user_id === localUserId);
      if (!userEntry) {
        // User not in this expense — skip
        result.skipped++;
        continue;
      }

      // ── Settlement branch ───────────────────────────────────────────────
      if (expense.payment) {
        await processSettlement(expense, localUserId);
        result.settlements++;
        continue;
      }

      // ── Regular expense branch ──────────────────────────────────────────
      const userPaidShare = parseFloat(userEntry.paid_share);
      const userOwedShare = parseFloat(userEntry.owed_share);
      const totalAmount = parseFloat(expense.cost);
      const receivableDiff = userPaidShare - userOwedShare;
      const receivableAmount = receivableDiff > 0 ? receivableDiff : null;

      // Determine category
      const localCategoryType = mapSplitwiseCategoryToLocal(expense.category.name);
      const localCategory = categoryByType.get(localCategoryType) ?? categoryByType.get(CategoryTypeEnum.OTHER);

      // Parse date to YYYY-MM-DD
      const expenseDate = dayjs(expense.date).format('YYYY-MM-DD');

      // Check if we already have a row for this Splitwise expense
      const splitwiseIdStr = String(expense.id);
      const existingSplitwiseRow = await getSplitwiseExpenseBySplitwiseId(splitwiseIdStr);

      let expenseId: string;

      // Full cash outflow model:
      // - Payer: amount = what they actually paid out (userPaidShare)
      // - Non-payer: amount = what they owe (userOwedShare)
      const expenseAmount = userPaidShare > 0 ? userPaidShare : userOwedShare;

      if (existingSplitwiseRow) {
        // Update the linked local expense in-place
        await updateExpense(existingSplitwiseRow.expenseId, {
          amount: expenseAmount,
          description: expense.description || null,
          date: expenseDate,
          categoryId: localCategory?.id ?? null,
        });
        expenseId = existingSplitwiseRow.expenseId;
      } else {
        // Create a new local expense row
        const localExpense = await createExpense({
          amount: expenseAmount,
          description: expense.description || null,
          date: expenseDate,
          categoryId: localCategory?.id ?? null,
        });

        if (!localExpense) {
          result.errors++;
          continue;
        }
        expenseId = localExpense.id;
      }

      // Upsert splitwise_expenses row (handles both insert and update via onConflictDoUpdate)
      await upsertSplitwiseExpense({
        expenseId,
        splitwiseId: splitwiseIdStr,
        splitwiseGroupId: expense.group_id ?? null,
        paidByUserId: String(localUserId),
        totalAmount,
        userPaidShare,
        userOwedShare,
        receivableAmount,
        receivableSettled: 0,
        isSettlement: 0,
        splitwiseCategory: expense.category.name,
        splitwiseUpdatedAt: expense.updated_at,
        syncStatus: 'synced',
        lastSyncedAt: dayjs().toISOString(),
      });

      result.synced++;
    } catch (err) {
      console.error('[splitwise/sync] Error processing expense:', expense.id, err);
      result.errors++;
    }
  }

  // ── Update last synced timestamp ─────────────────────────────────────────
  await AsyncStorage.setItem(AsyncStorageKeys.SPLITWISE_LAST_SYNCED_AT, dayjs().toISOString());

  return result;
};

// ============================================
// SKIP LOGIC
// ============================================

/**
 * Returns a reason string if the expense should be skipped, null if it should be processed.
 * Settlements (payment: true) are NOT skipped — they are routed to the settlement branch.
 */
const shouldSkipExpense = (expense: SplitwiseExpenseData): string | null => {
  if (expense.deleted_at) return 'deleted';
  if (expense.currency_code !== 'INR') return `non-INR currency: ${expense.currency_code}`;
  return null;
};

// ============================================
// SETTLEMENT PROCESSING
// ============================================

/**
 * Process a Splitwise settlement entry (`payment: true`).
 *
 * When the current user is owed money (someone paid the user back):
 *   1. Find and mark matching unsettled receivable rows as settled.
 *   2. Create an income entry (type: splitwise_settlement).
 *   3. Insert an audit row in splitwise_expenses (isSettlement: 1).
 *
 * For pre-install settlements (no matching local expense), steps 2 and 3 still run.
 */
const processSettlement = async (expense: SplitwiseExpenseData, localUserId: number): Promise<void> => {
  const splitwiseIdStr = String(expense.id);
  const settlementDate = dayjs(expense.date).format('YYYY-MM-DD');
  const totalAmount = parseFloat(expense.cost);

  // Check if we already processed this settlement
  const existingRow = await getSplitwiseExpenseBySplitwiseId(splitwiseIdStr);
  if (existingRow?.isSettlement === 1) {
    // Already processed — skip silently
    return;
  }

  // Determine who paid whom in this settlement.
  // The user with paid_share > 0 is the one who made the payment (settled their debt).
  // The user with owed_share > 0 is the one who received the payment.
  const localUserEntry = expense.users.find((u) => u.user_id === localUserId);
  if (!localUserEntry) return;

  const localUserOwedShare = parseFloat(localUserEntry.owed_share);
  const isCurrentUserReceiving = localUserOwedShare > 0;
  const settlementAmount = totalAmount;

  // Only process receivable settlement when the current user is receiving money
  if (isCurrentUserReceiving) {
    // Find the friend who paid us (the one with paid_share > 0)
    const payerEntry = expense.users.find((u) => u.user_id !== localUserId && parseFloat(u.paid_share) > 0);

    if (payerEntry) {
      // Try to mark matching unsettled receivables as settled.
      // The original expense where the local user paid has paidByUserId = localUserId,
      // but the friend who owed us money can be matched by finding rows where we have
      // a receivable. We mark them settled up to the settlement amount.
      const unsettledRows = await getUnsettledReceivablesByPaidByUser(String(localUserId));
      let remainingToSettle = settlementAmount;

      for (const row of unsettledRows) {
        if (remainingToSettle <= 0) break;
        if (row.splitwiseId) {
          await markReceivableSettledBySplitwiseId(row.splitwiseId);
          remainingToSettle -= row.receivableAmount ?? 0;
        }
      }
    }
  }

  // Create income entry regardless of whether a matching local expense exists (pre-install case).
  // Settlement income is always created when the current user receives money.
  if (isCurrentUserReceiving) {
    const payerName =
      expense.users.find((u) => u.user_id !== localUserId && parseFloat(u.paid_share) > 0)?.user.first_name ??
      SPLITWISE_STRINGS.settlementPayerFallback;

    await createIncome({
      amount: settlementAmount,
      type: IncomeTypeEnum.SPLITWISE_SETTLEMENT,
      date: settlementDate,
      description: `${SPLITWISE_STRINGS.settlementIncomePrefix} ${payerName}`,
    });
  }

  // Insert audit row in splitwise_expenses with isSettlement = 1.
  // We need a dummy expense row for the FK — create one with excludeFromSpending = 1.
  const dummyExpense = await createExpense({
    amount: settlementAmount,
    description: expense.description || SPLITWISE_STRINGS.settlementExpenseFallback,
    date: settlementDate,
    excludeFromSpending: 1,
  });

  if (dummyExpense) {
    await upsertSplitwiseExpense({
      expenseId: dummyExpense.id,
      splitwiseId: splitwiseIdStr,
      splitwiseGroupId: expense.group_id ?? null,
      paidByUserId: String(localUserId),
      totalAmount,
      userPaidShare: parseFloat(localUserEntry.paid_share),
      userOwedShare: parseFloat(localUserEntry.owed_share),
      receivableAmount: null,
      receivableSettled: 0,
      isSettlement: 1,
      splitwiseCategory: expense.category.name,
      splitwiseUpdatedAt: expense.updated_at,
      syncStatus: 'synced',
      lastSyncedAt: dayjs().toISOString(),
    });
  }
};

// ============================================
// FRIEND BALANCES FETCH
// ============================================

/**
 * Fetch balances for all Splitwise friends from the /get_friends API.
 *
 * Filters each friend's balance array to INR only.
 * Positive netAmount = they owe you; negative netAmount = you owe them.
 *
 * Returns an empty array if the user is not connected (no tokens).
 */
export const fetchFriendBalances = async (): Promise<SplitwiseFriendBalanceEntry[]> => {
  await ensureNetworkAvailable();

  const tokens = await splitwiseAuth.loadTokens();
  if (!tokens) {
    return [];
  }

  const client = createHttpClient({ baseUrl: SPLITWISE_API_BASE_URL, authProvider: splitwiseAuth });

  const response = await client.get<SplitwiseFriendsWithBalanceResponse>('/get_friends');

  return response.friends.map((friend) => {
    const inrBalance = friend.balance.find((b) => b.currency_code === 'INR');
    const netAmount = inrBalance ? parseFloat(inrBalance.amount) : 0;

    return {
      id: friend.id,
      firstName: friend.first_name,
      lastName: friend.last_name ?? '',
      netAmount,
      avatarUrl: friend.picture?.medium ?? null,
    };
  });
};

// ============================================
// LAST SYNCED AT READER
// ============================================

/**
 * Read the ISO timestamp of the last successful sync, or null if never synced.
 */
export const getLastSyncedAt = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AsyncStorageKeys.SPLITWISE_LAST_SYNCED_AT);
};

// ============================================
// SINGLE EXPENSE FETCH
// ============================================

/**
 * Fetch a single expense from the Splitwise API by its remote splitwiseId.
 * Used for edit conflict detection — compare remote `updated_at` with local `splitwiseUpdatedAt`.
 *
 * @returns The remote expense data, or null if the request fails.
 */
export const fetchSplitwiseExpense = async (splitwiseId: string): Promise<SplitwiseExpenseData | null> => {
  await ensureNetworkAvailable();

  const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
  const url = `${SPLITWISE_SYNC_ENDPOINTS.GET_EXPENSE}/${splitwiseId}`;

  const { expense } = await client.get<SplitwiseSingleExpenseResponse>(url);
  return expense;
};

// ============================================
// UPDATE EXPENSE ON SPLITWISE
// ============================================

export type SplitwiseUpdateExpensePayload = Record<string, unknown>;

/**
 * Push local edits to Splitwise for a given expense.
 *
 * @param splitwiseId — the remote Splitwise expense ID
 * @param payload — fields to update (cost, description, date)
 * @returns The updated remote expense data
 */
export const updateSplitwiseExpenseRemote = async (
  splitwiseId: string,
  payload: SplitwiseUpdateExpensePayload
): Promise<SplitwiseExpenseData> => {
  await ensureNetworkAvailable();

  const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
  const url = `${SPLITWISE_SYNC_ENDPOINTS.UPDATE_EXPENSE}/${splitwiseId}`;

  const body = JSON.stringify(payload);
  const { expenses, errors } = await client.post<SplitwiseUpdateExpenseResponse>(url, body, {
    headers: { 'Accept-Encoding': 'identity' },
  });

  // Splitwise returns 200 even on failure — errors object is the real indicator
  if (errors && Object.keys(errors).length > 0) {
    console.error('[splitwise/sync] updateSplitwiseExpenseRemote errors:', JSON.stringify(errors));
    throw new Error(`Splitwise rejected update: ${JSON.stringify(errors)}`);
  }

  const expense = expenses[0];
  if (!expense) {
    throw new Error('[splitwise/sync] updateSplitwiseExpenseRemote: no expense returned from API');
  }
  return expense;
};
