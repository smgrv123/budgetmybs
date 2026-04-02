import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { splitwiseSyncQueueTable } from '../schema';

export const enqueueSplitwisePush = async (
  localExpenseId: string,
  payload: Record<string, string | number | boolean>
): Promise<void> => {
  await db.insert(splitwiseSyncQueueTable).values({ localExpenseId, payload });
};

export const getPendingQueueItems = async () => {
  return db.select().from(splitwiseSyncQueueTable).orderBy(asc(splitwiseSyncQueueTable.createdAt));
};

export const deleteQueueItem = async (id: string): Promise<void> => {
  await db.delete(splitwiseSyncQueueTable).where(eq(splitwiseSyncQueueTable.id, id));
};

export const incrementQueueRetry = async (id: string): Promise<void> => {
  await db
    .update(splitwiseSyncQueueTable)
    .set({
      retryCount: sql`${splitwiseSyncQueueTable.retryCount} + 1`,
      lastAttemptedAt: new Date().toISOString(),
    })
    .where(eq(splitwiseSyncQueueTable.id, id));
};
