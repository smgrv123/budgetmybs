import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '../client';
import { splitwiseExpensesTable } from '../schema';
import type { CreateSplitwiseExpenseInput, SplitwiseExpense, UpdateSplitwiseExpenseInput } from '../schema-types';

// ============================================
// BALANCE SUMMARY TYPES
// ============================================

export type SplitwiseBalanceSummary = {
  /** Total amount others owe you (sum of unsettled receivableAmount) */
  totalOwedToYou: number;
  /** Total amount you owe others (sum of userOwedShare − userPaidShare where positive) */
  totalYouOwe: number;
};

export type SplitwiseFriendBalance = {
  paidByUserId: string;
  displayName: string;
  /** Medium-size profile picture URL from Splitwise, if available */
  avatarUrl: string | null;
  owedToYou: number;
  youOwe: number;
  /** Positive = they owe you; negative = you owe them */
  netAmount: number;
};

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

// ============================================
// MARK RECEIVABLE AS SETTLED (by splitwiseId)
// ============================================

/**
 * Flip `receivableSettled = 1` on a splitwise_expenses row identified by its
 * remote Splitwise ID. Used during settlement processing.
 * Returns the updated row, or null if not found.
 */
export const markReceivableSettledBySplitwiseId = async (splitwiseId: string): Promise<SplitwiseExpense | null> => {
  const result = await db
    .update(splitwiseExpensesTable)
    .set({ receivableSettled: 1, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(splitwiseExpensesTable.splitwiseId, splitwiseId))
    .returning();

  return result[0] ?? null;
};

// ============================================
// GET UNSETTLED RECEIVABLES BY FRIEND
// ============================================

/**
 * Fetch all unsettled receivable splitwise_expenses rows where the local user
 * paid (paidByUserId matches) and has a positive receivable.
 * Used to match settlement payments to original expenses.
 */
export const getUnsettledReceivablesByPaidByUser = async (
  paidByUserId: string
): Promise<readonly SplitwiseExpense[]> => {
  return db
    .select()
    .from(splitwiseExpensesTable)
    .where(
      and(
        eq(splitwiseExpensesTable.paidByUserId, paidByUserId),
        eq(splitwiseExpensesTable.receivableSettled, 0),
        eq(splitwiseExpensesTable.isSettlement, 0),
        gt(splitwiseExpensesTable.receivableAmount, 0)
      )
    );
};

// ============================================
// BALANCE SUMMARY
// ============================================

/**
 * Returns aggregate balance totals for the dashboard card:
 *   - totalOwedToYou: SUM(receivableAmount) WHERE receivableSettled=0 AND isSettlement=0
 *   - totalYouOwe: SUM(userOwedShare - userPaidShare) WHERE diff > 0 AND receivableSettled=0 AND isSettlement=0
 */
export const getSplitwiseBalanceSummary = async (): Promise<SplitwiseBalanceSummary> => {
  const rows = await db
    .select({
      totalOwedToYou: sql<number>`COALESCE(SUM(CASE WHEN ${splitwiseExpensesTable.receivableAmount} IS NOT NULL AND ${splitwiseExpensesTable.receivableAmount} > 0 THEN ${splitwiseExpensesTable.receivableAmount} ELSE 0 END), 0)`,
      totalYouOwe: sql<number>`COALESCE(SUM(CASE WHEN ${splitwiseExpensesTable.userOwedShare} > ${splitwiseExpensesTable.userPaidShare} THEN ${splitwiseExpensesTable.userOwedShare} - ${splitwiseExpensesTable.userPaidShare} ELSE 0 END), 0)`,
    })
    .from(splitwiseExpensesTable)
    .where(and(eq(splitwiseExpensesTable.receivableSettled, 0), eq(splitwiseExpensesTable.isSettlement, 0)));

  return {
    totalOwedToYou: rows[0]?.totalOwedToYou ?? 0,
    totalYouOwe: rows[0]?.totalYouOwe ?? 0,
  };
};

// ============================================
// PER-FRIEND BALANCE BREAKDOWN
// ============================================

/**
 * Returns per-friend balance breakdown grouped by paidByUserId.
 */
export const getSplitwiseBalancesByFriend = async (): Promise<SplitwiseFriendBalance[]> => {
  const rows = await db
    .select({
      paidByUserId: splitwiseExpensesTable.paidByUserId,
      owedToYou: sql<number>`COALESCE(SUM(CASE WHEN ${splitwiseExpensesTable.receivableAmount} > 0 THEN ${splitwiseExpensesTable.receivableAmount} ELSE 0 END), 0)`,
      youOwe: sql<number>`COALESCE(SUM(CASE WHEN ${splitwiseExpensesTable.userOwedShare} - ${splitwiseExpensesTable.userPaidShare} > 0 THEN ${splitwiseExpensesTable.userOwedShare} - ${splitwiseExpensesTable.userPaidShare} ELSE 0 END), 0)`,
    })
    .from(splitwiseExpensesTable)
    .where(and(eq(splitwiseExpensesTable.receivableSettled, 0), eq(splitwiseExpensesTable.isSettlement, 0)))
    .groupBy(splitwiseExpensesTable.paidByUserId);

  return rows
    .map((row) => ({
      paidByUserId: row.paidByUserId,
      displayName: row.paidByUserId,
      avatarUrl: null,
      owedToYou: row.owedToYou,
      youOwe: row.youOwe,
      netAmount: row.owedToYou - row.youOwe,
    }))
    .filter((row) => row.owedToYou > 0 || row.youOwe > 0);
};
