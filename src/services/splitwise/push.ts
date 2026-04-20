/**
 * Splitwise outbound push service.
 *
 * Responsibilities:
 *  - pushExpenseToSplitwise(): POST /api/v3.0/create_expense
 *  - enqueueFailedPush(): append to AsyncStorage SPLITWISE_PUSH_QUEUE
 *  - drainPushQueue(): retry all queued items, removing on success
 *
 * Callers own the offline-first contract:
 *   1. Save locally first (always succeeds).
 *   2. Call pushExpenseToSplitwise; if it throws, call enqueueFailedPush.
 *   3. Call drainPushQueue() on app open / pull-to-refresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { SPLITWISE_API_BASE_URL } from '@/src/constants/splitwise.config';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import { ensureNetworkAvailable } from '@/src/utils/network';
import type { SplitwiseCreateExpenseResponse, SplitwisePushQueueItem } from '@/src/validation/splitwisePush';
import { SplitwisePushQueueSchema } from '@/src/validation/splitwisePush';

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
 */
export const enqueueFailedPush = async (expenseId: string, payload: Record<string, unknown>): Promise<void> => {
  const queue = await readQueue();
  const item: SplitwisePushQueueItem = {
    expenseId,
    payload,
    queuedAt: dayjs().toISOString(),
    attempts: 0,
  };
  await writeQueue([...queue, item]);
};

/**
 * Drain the push queue: attempt to push each queued item.
 * Successfully pushed items are removed; failed ones stay (attempts++).
 */
export const drainPushQueue = async (): Promise<void> => {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining: SplitwisePushQueueItem[] = [];

  for (const item of queue) {
    try {
      await pushExpenseToSplitwise(item.payload);
      // Success — do not add back to queue
    } catch {
      // Keep in queue with incremented attempts
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  await writeQueue(remaining);
};
