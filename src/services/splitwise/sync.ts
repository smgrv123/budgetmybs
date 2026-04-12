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
 *   - Settlements (payment: true) are skipped.
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
  updateExpense,
  upsertSplitwiseExpense,
  getSplitwiseExpenseBySplitwiseId,
} from '@/db';
import { CategoryTypeEnum } from '@/db/types';
import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import {
  SPLITWISE_API_CALL_DELAY_MS,
  SPLITWISE_SYNC_EXPENSE_LIMIT,
  SPLITWISE_SYNC_ENDPOINTS,
  SPLITWISE_USER_ID_KEY,
} from '@/src/constants/splitwise.config';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import { mapSplitwiseCategoryToLocal } from '@/src/services/splitwise/categoryMap';
import { ensureNetworkAvailable } from '@/src/utils/network';
import type {
  SplitwiseExpensesResponse,
  SplitwiseExpenseData,
  SplitwiseCurrentUserApiResponse,
} from '@/src/validation/splitwise';
import type { SplitwiseSyncResult } from '@/src/types/splitwise';

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

  const result: SplitwiseSyncResult = { synced: 0, skipped: 0, errors: 0 };

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

      if (existingSplitwiseRow) {
        // Update the linked local expense in-place
        await updateExpense(existingSplitwiseRow.expenseId, {
          amount: userOwedShare,
          description: expense.description || null,
          date: expenseDate,
          categoryId: localCategory?.id ?? null,
        });
        expenseId = existingSplitwiseRow.expenseId;
      } else {
        // Create a new local expense row
        // We use userOwedShare as the amount (the user's actual share of the expense)
        const localExpense = await createExpense({
          amount: userOwedShare,
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
        splitwiseGroupId: null,
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
 */
const shouldSkipExpense = (expense: SplitwiseExpenseData): string | null => {
  if (expense.payment) return 'settlement';
  if (expense.deleted_at) return 'deleted';
  if (expense.currency_code !== 'INR') return `non-INR currency: ${expense.currency_code}`;
  return null;
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
