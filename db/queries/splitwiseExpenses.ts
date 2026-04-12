import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { splitwiseExpensesTable } from '../schema';
import type { CreateSplitwiseExpenseInput, SplitwiseExpense, UpdateSplitwiseExpenseInput } from '../schema-types';

// ============================================
// INSERT SPLITWISE EXPENSE
// ============================================

/**
 * Insert a new splitwise_expenses row. Use this when creating a brand-new record
 * (e.g., logging a local expense that will be pushed to Splitwise later).
 */
export const insertSplitwiseExpense = async (data: CreateSplitwiseExpenseInput): Promise<SplitwiseExpense> => {
  const result = await db.insert(splitwiseExpensesTable).values(data).returning();
  const row = result[0];
  if (!row) {
    throw new Error('insertSplitwiseExpense: insert returned no rows');
  }
  return row;
};

// ============================================
// UPSERT SPLITWISE EXPENSE (by splitwiseId)
// ============================================

/**
 * Insert or update a splitwise_expenses row on conflict of `splitwiseId`.
 * Use this when syncing from the Splitwise API — if the remote expense already
 * exists locally it will be updated in place; otherwise a new row is created.
 *
 * NOTE: `splitwiseId` must be non-null to use this function. For pending-push
 * rows (where splitwiseId is still null), use `insertSplitwiseExpense` instead.
 */
export const upsertSplitwiseExpense = async (
  data: CreateSplitwiseExpenseInput & { splitwiseId: string }
): Promise<SplitwiseExpense> => {
  const result = await db
    .insert(splitwiseExpensesTable)
    .values(data)
    .onConflictDoUpdate({
      target: splitwiseExpensesTable.splitwiseId,
      set: { ...data, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error('upsertSplitwiseExpense: upsert returned no rows');
  }
  return row;
};

// ============================================
// GET BY LOCAL EXPENSE ID
// ============================================

/**
 * Look up the splitwise_expenses row for a given local expense FK.
 * Returns null if no matching row exists.
 */
export const getSplitwiseExpenseByExpenseId = async (expenseId: string): Promise<SplitwiseExpense | null> => {
  const result = await db
    .select()
    .from(splitwiseExpensesTable)
    .where(eq(splitwiseExpensesTable.expenseId, expenseId))
    .limit(1);

  return result[0] ?? null;
};

// ============================================
// GET BY SPLITWISE ID
// ============================================

/**
 * Look up a splitwise_expenses row by its remote Splitwise ID.
 * Returns null if not found (e.g., ID not yet synced or never imported).
 */
export const getSplitwiseExpenseBySplitwiseId = async (splitwiseId: string): Promise<SplitwiseExpense | null> => {
  const result = await db
    .select()
    .from(splitwiseExpensesTable)
    .where(eq(splitwiseExpensesTable.splitwiseId, splitwiseId))
    .limit(1);

  return result[0] ?? null;
};

// ============================================
// UPDATE SPLITWISE EXPENSE
// ============================================

/**
 * Apply a partial update to an existing splitwise_expenses row by its local UUID.
 * Always stamps `updatedAt` to the current timestamp.
 */
export const updateSplitwiseExpense = async (
  id: string,
  data: UpdateSplitwiseExpenseInput
): Promise<SplitwiseExpense | null> => {
  const result = await db
    .update(splitwiseExpensesTable)
    .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(splitwiseExpensesTable.id, id))
    .returning();

  return result[0] ?? null;
};
