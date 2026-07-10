/**
 * Splitwise outbound push service.
 *
 * Responsibilities:
 *  - pushExpenseToSplitwise(): POST /api/v3.0/create_expense
 *  - deleteExpenseOnSplitwise(): POST /api/v3.0/delete_expense/:id
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

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import {
  SPLITWISE_API_BASE_URL,
  SPLITWISE_SYNC_ENDPOINTS,
  SplitwisePushAction,
} from '@/src/constants/splitwise.config';
import { createHttpClient } from '@/src/services/api';
import { splitwiseAuth } from '@/src/services/splitwise/SplitwiseAuthService';
import { ensureNetworkAvailable } from '@/src/utils/network';
import type { BuildSettlementPayloadParams } from '@/src/types/splitwise-outbound';
import { buildSettlementPayload } from '@/src/utils/splitwisePushPayload';
import type {
  SplitwiseCreateExpenseResponse,
  SplitwiseDeleteExpenseResponse,
  SplitwisePushQueueItem,
  SplitwisePushRequest,
} from '@/src/validation/splitwisePush';
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

  const { expenses, errors } = response;
  if (errors && Object.keys(errors).length > 0) {
    console.error('[splitwise/push] pushExpenseToSplitwise errors:', JSON.stringify(errors));
    throw new Error(`Splitwise rejected create: ${JSON.stringify(errors)}`);
  }

  const firstExpense = expenses[0];
  if (!firstExpense) {
    throw new Error('Splitwise create_expense returned no expense');
  }
  return firstExpense.id;
};

/**
 * POST a remote Splitwise expense delete by its remote ID.
 * Throws on network failure, auth error, or API error.
 */
export const deleteExpenseOnSplitwise = async (splitwiseId: string): Promise<void> => {
  await ensureNetworkAvailable();

  const url = `${SPLITWISE_SYNC_ENDPOINTS.DELETE_EXPENSE}/${splitwiseId}`;
  const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
  const response = await client.post<SplitwiseDeleteExpenseResponse>(url);

  if (response.success !== true) {
    throw new Error(`Splitwise delete_expense failed for id=${splitwiseId}`);
  }
};

/**
 * Push a settlement (payment: true) expense to Splitwise.
 * Reuses the create_expense endpoint via pushExpenseToSplitwise.
 *
 * @returns The remote Splitwise expense ID for the settlement.
 */
export const pushSettlementExpense = async (params: BuildSettlementPayloadParams): Promise<number> => {
  const payload = buildSettlementPayload(params);
  return pushExpenseToSplitwise(payload);
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
 * Accepts a single discriminated-union request:
 *  - { action: 'create', expenseId, payload }
 *  - { action: 'update', expenseId, payload, splitwiseId }
 *  - { action: 'delete', splitwiseId }
 */
export const enqueueFailedPush = async (request: SplitwisePushRequest): Promise<void> => {
  const queue = await readQueue();
  const queuedAt = dayjs().toISOString();
  const item: SplitwisePushQueueItem = { ...request, queuedAt, attempts: 0 };
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
          const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
          const url = `${SPLITWISE_SYNC_ENDPOINTS.UPDATE_EXPENSE}/${item.splitwiseId}`;
          await client.post(url, JSON.stringify(item.payload), { headers: { 'Accept-Encoding': 'identity' } });
          break;
        }
        case SplitwisePushAction.DELETE:
          await deleteExpenseOnSplitwise(item.splitwiseId);
          break;
      }
      // Success — do not add back to queue
    } catch {
      // Keep in queue with incremented attempts
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  await writeQueue(remaining);
};
