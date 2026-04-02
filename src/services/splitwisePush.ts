import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { expensesTable } from '@/db/schema';
import { RecurringSourceTypeEnum } from '@/db/types';
import {
  deleteQueueItem,
  enqueueSplitwisePush,
  getPendingQueueItems,
  incrementQueueRetry,
} from '@/db/queries/splitwiseQueue';
import { withSilentReauth } from '@/src/services/splitwise';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment';

export type SplitParticipant = {
  userId: number;
  paidShare: number; // Current user pays full amount; others pay 0
  owedShare: number; // Their portion of the cost
};

export type SplitConfig = {
  totalAmount: number;
  description: string;
  date: string; // YYYY-MM-DD
  groupId: number | null; // null = friend split (group_id = 0)
  splitType: SplitType;
  participants: SplitParticipant[]; // current user is index 0
};

// ─── Payload builder ───────────────────────────────────────────────────────────

export const buildCreateExpensePayload = (
  config: SplitConfig,
  currentUserId: number
): Record<string, string | number | boolean> => {
  const base: Record<string, string | number | boolean> = {
    cost: config.totalAmount.toFixed(2),
    description: config.description,
    currency_code: 'INR',
    date: `${config.date}T00:00:00Z`,
    group_id: config.groupId ?? 0,
  };

  if (config.splitType === 'equal') {
    return { ...base, split_equally: true };
  }

  const userFields: Record<string, string> = {};
  // Ensure current user is at index 0
  const participants =
    config.participants[0]?.userId === currentUserId
      ? config.participants
      : [{ userId: currentUserId, paidShare: config.totalAmount, owedShare: 0 }, ...config.participants];

  participants.forEach((p, i) => {
    userFields[`users__${i}__user_id`] = String(p.userId);
    userFields[`users__${i}__paid_share`] = p.paidShare.toFixed(2);
    userFields[`users__${i}__owed_share`] = p.owedShare.toFixed(2);
  });

  return { ...base, ...userFields };
};

// ─── Push to Splitwise ─────────────────────────────────────────────────────────

export const pushExpenseToSplitwise = async (
  localExpenseId: string,
  payload: Record<string, string | number | boolean>
): Promise<{ success: boolean; splitwiseId?: string }> => {
  const result = await withSilentReauth(async (client) => {
    const response = await client.expenses.createExpense(payload as any);
    const splitwiseId = response?.expenses?.[0]?.id;
    return splitwiseId ? String(splitwiseId) : null;
  });

  if (!result) {
    await enqueueSplitwisePush(localExpenseId, payload);
    return { success: false };
  }

  await db
    .update(expensesTable)
    .set({ sourceId: result, sourceType: RecurringSourceTypeEnum.SPLITWISE })
    .where(eq(expensesTable.id, localExpenseId));

  return { success: true, splitwiseId: result };
};

// ─── Drain queue ───────────────────────────────────────────────────────────────

export const drainSplitQueue = async (): Promise<void> => {
  const items = await getPendingQueueItems();
  if (items.length === 0) return;

  for (const item of items) {
    const result = await withSilentReauth(async (client) => {
      const response = await client.expenses.createExpense(item.payload as any);
      const id = response?.expenses?.[0]?.id;
      return id ? String(id) : null;
    });

    if (result) {
      await db
        .update(expensesTable)
        .set({ sourceId: result, sourceType: RecurringSourceTypeEnum.SPLITWISE })
        .where(eq(expensesTable.id, item.localExpenseId));
      await deleteQueueItem(item.id);
    } else {
      await incrementQueueRetry(item.id);
    }
  }
};
