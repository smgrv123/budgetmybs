/**
 * Splitwise outbound push service.
 *
 * Responsibilities:
 *  - pushExpenseToSplitwise(): POST /api/v3.0/create_expense
 *  - deleteExpenseOnSplitwise(): DELETE /api/v3.0/delete_expense/:id
 *  - enqueueFailedPush(): append to AsyncStorage SPLITWISE_PUSH_QUEUE
 *  - drainPushQueue(): retry all queued items, routing to correct endpoint by action
 *
 * Callers own the offline-first contract:
 *   1. Save locally first (always succeeds).
 *   2. Call pushExpenseToSplitwise; if it throws, call enqueueFailedPush.
 *   3. Call drainPushQueue() on app open / pull-to-refresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { z } from 'zod';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import {
  SPLITWISE_API_BASE_URL,
  SPLITWISE_SYNC_ENDPOINTS,
  SplitwisePushAction,
  SplitwisePushActionType,
} from '@/src/constants/splitwise.config';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import { ensureNetworkAvailable } from '@/src/utils/network';
import type { SplitwiseCreateExpenseResponse, SplitwisePushQueueItem } from '@/src/validation/splitwisePush';
import { SplitwisePushQueueSchema } from '@/src/validation/splitwisePush';

const SplitwisePushItemWithIdSchema = z.object({ splitwiseId: z.string() }).loose();

// ============================================
// PUSH EXPENSE
// ============================================

/**
 * POST a create_expense payload to Splitwise.
 * Throws on network failure, auth error, or API error.
 */
export const pushExpenseToSplitwise = async (payload: Record<string, unknown>): Promise<number> => {
  await ensureNetworkAvailable();

  const client = createHttpClient({ baseUrl: SPLITWISE_API_BASE_URL, authProvider: splitwiseAuth });
  const response = await client.post<SplitwiseCreateExpenseResponse>('/create_expense', JSON.stringify(payload));

  const firstExpense = response.expenses[0];
  if (!firstExpense) {
    throw new Error('Splitwise create_expense returned no expense');
  }
  return firstExpense.id;
};

// ============================================
// QUEUE MANAGEMENT
// ============================================

/**
 * Read the current push queue from AsyncStorage.
 * Returns an empty array if nothing is stored or parsing fails.
 */
const readQueue = async (): Promise<SplitwisePushQueueItem[]> => {
  const raw = await AsyncStorage.getItem(AsyncStorageKeys.SPLITWISE_PUSH_QUEUE);
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  const result = SplitwisePushQueueSchema.safeParse(parsed);
  return result.success ? result.data : [];
};

/**
 * Write the queue back to AsyncStorage.
 */
const writeQueue = async (queue: SplitwisePushQueueItem[]): Promise<void> => {
  await AsyncStorage.setItem(AsyncStorageKeys.SPLITWISE_PUSH_QUEUE, JSON.stringify(queue));
};

/**
 * Add a failed push to the retry queue.
 *
 * @param expenseId - Local expense UUID
 * @param action    - The operation type: 'create' | 'update' | 'delete'
 * @param payload   - The request body (empty object for delete)
 */
export const enqueueFailedPush = async (
  expenseId: string,
  action: SplitwisePushActionType,
  payload: Record<string, unknown>
): Promise<void> => {
  const queue = await readQueue();
  const item: SplitwisePushQueueItem = {
    expenseId,
    action,
    payload,
    queuedAt: dayjs().toISOString(),
    attempts: 0,
  };
  await writeQueue([...queue, item]);
};

/**
 * Drain the push queue: attempt to push each queued item.
 * Routes each item to the correct Splitwise endpoint based on its action.
 * Successfully pushed items are removed; failed ones stay (attempts++).
 */
export const drainPushQueue = async (): Promise<void> => {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining: SplitwisePushQueueItem[] = [];

  for (const item of queue) {
    try {
      switch (item.action) {
        case SplitwisePushAction.CREATE:
          await pushExpenseToSplitwise(item.payload);
          break;
        case SplitwisePushAction.UPDATE: {
          const parsed = SplitwisePushItemWithIdSchema.safeParse(item.payload);
          if (!parsed.success) {
            throw new Error(`[drainPushQueue] update item missing splitwiseId for expenseId=${item.expenseId}`);
          }
          const { splitwiseId } = parsed.data;
          const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
          const url = `${SPLITWISE_SYNC_ENDPOINTS.UPDATE_EXPENSE}/${splitwiseId}`;
          await client.post(url, JSON.stringify(item.payload), { headers: { 'Accept-Encoding': 'identity' } });
          break;
        }
        case SplitwisePushAction.DELETE: {
          const parsed = SplitwisePushItemWithIdSchema.safeParse(item.payload);
          if (!parsed.success) {
            throw new Error(`[drainPushQueue] delete item missing splitwiseId for expenseId=${item.expenseId}`);
          }
          const { splitwiseId } = parsed.data;
          const url = `${SPLITWISE_SYNC_ENDPOINTS.DELETE_EXPENSE}/${splitwiseId}`;

          const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
          await client.delete(url);
          break;
        }
      }
      // Success — do not add back to queue
    } catch {
      // Keep in queue with incremented attempts
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  await writeQueue(remaining);
};
