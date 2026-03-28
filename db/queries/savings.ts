import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../client';
import { expensesTable, savingsGoalsTable } from '../schema';
import type {
  AdHocSavingsBalance,
  CreateSavingsGoalInput,
  GoalSavingsBalance,
  SavingsBalance,
  UpdateSavingsGoalInput,
} from '../schema-types';

// ============================================
// GET ALL SAVINGS GOALS
// ============================================

export const getSavingsGoals = async (activeOnly = true) => {
  if (activeOnly) {
    return db.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.isActive, 1));
  }
  return db.select().from(savingsGoalsTable);
};

// ============================================
// GET SAVINGS GOAL BY ID
// ============================================

export const getSavingsGoalById = async (id: string) => {
  const result = await db.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.id, id)).limit(1);

  return result[0] ?? null;
};

// ============================================
// GET TOTAL MONTHLY SAVINGS TARGET
// ============================================

export const getTotalMonthlySavingsTarget = async () => {
  const result = await db
    .select({
      total: sql<number>`SUM(${savingsGoalsTable.targetAmount})`,
    })
    .from(savingsGoalsTable)
    .where(eq(savingsGoalsTable.isActive, 1));

  return result[0]?.total ?? 0;
};

// ============================================
// CREATE SAVINGS GOAL
// ============================================

export const createSavingsGoal = async (data: CreateSavingsGoalInput) => {
  const result = await db
    .insert(savingsGoalsTable)
    .values({
      ...data,
      customType: data.customType ?? null,
      icon: data.icon ?? null,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE SAVINGS GOAL
// ============================================

export const updateSavingsGoal = async (id: string, updateData: UpdateSavingsGoalInput) => {
  const result = await db
    .update(savingsGoalsTable)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(savingsGoalsTable.id, id))
    .returning();

  return result[0];
};

// ============================================
// DELETE SAVINGS GOAL
// ============================================

export const deleteSavingsGoal = async (id: string) => {
  await db.delete(savingsGoalsTable).where(eq(savingsGoalsTable.id, id));
};

// ============================================
// GET COMPLETED SAVINGS GOALS
// ============================================

export const getCompletedSavingsGoals = async () => {
  return db
    .select()
    .from(savingsGoalsTable)
    .where(and(eq(savingsGoalsTable.isCompleted, 1), eq(savingsGoalsTable.isActive, 1)))
    .orderBy(savingsGoalsTable.updatedAt);
};

// ============================================
// GET INCOMPLETE SAVINGS GOALS
// ============================================

export const getIncompleteSavingsGoals = async () => {
  return db
    .select()
    .from(savingsGoalsTable)
    .where(and(eq(savingsGoalsTable.isCompleted, 0), eq(savingsGoalsTable.isActive, 1)))
    .orderBy(savingsGoalsTable.createdAt);
};

// ============================================
// MARK SAVINGS GOAL AS COMPLETED
// ============================================

export const markGoalAsCompleted = async (id: string) => {
  const result = await db
    .update(savingsGoalsTable)
    .set({
      isCompleted: 1,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(savingsGoalsTable.id, id))
    .returning();

  return result[0];
};

// ============================================
// SAVINGS BALANCE QUERIES
// ============================================

/**
 * Get deposited, withdrawn, and net balance for a specific savings goal.
 * Deposits: isSaving=1 AND savingsGoalId=goalId AND isWithdrawal=0
 * Withdrawals: isSaving=1 AND savingsGoalId=goalId AND isWithdrawal=1
 */
export const getSavingsBalanceByGoal = async (goalId: string): Promise<SavingsBalance> => {
  const rows = await db
    .select({
      deposited: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 0 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
      withdrawn: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 1 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
    })
    .from(expensesTable)
    .where(and(eq(expensesTable.isSaving, 1), eq(expensesTable.savingsGoalId, goalId)));

  const row = rows[0];
  const deposited = row?.deposited ?? 0;
  const withdrawn = row?.withdrawn ?? 0;

  return { deposited, withdrawn, net: deposited - withdrawn };
};

/**
 * Get balance summary for every savings goal that has at least one linked expense.
 * Returns an array of { goalId, goalName, goalType, deposited, withdrawn, net }.
 */
export const getSavingsBalancesByAllGoals = async (): Promise<GoalSavingsBalance[]> => {
  const rows = await db
    .select({
      goalId: savingsGoalsTable.id,
      goalName: savingsGoalsTable.name,
      goalType: savingsGoalsTable.type,
      deposited: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 0 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
      withdrawn: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 1 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
    })
    .from(expensesTable)
    .innerJoin(savingsGoalsTable, eq(expensesTable.savingsGoalId, savingsGoalsTable.id))
    .where(eq(expensesTable.isSaving, 1))
    .groupBy(savingsGoalsTable.id);

  return rows.map((row) => ({
    goalId: row.goalId,
    goalName: row.goalName,
    goalType: row.goalType,
    deposited: row.deposited,
    withdrawn: row.withdrawn,
    net: row.deposited - row.withdrawn,
  }));
};

/**
 * Get balance summary for ad-hoc savings (savingsGoalId IS NULL and isSaving = 1),
 * grouped by savingsType.
 * Returns an array of { savingsType, deposited, withdrawn, net }.
 */
export const getAdHocSavingsBalances = async (): Promise<AdHocSavingsBalance[]> => {
  const rows = await db
    .select({
      savingsType: expensesTable.savingsType,
      deposited: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 0 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
      withdrawn: sql<number>`COALESCE(SUM(CASE WHEN ${expensesTable.isWithdrawal} = 1 THEN ${expensesTable.amount} ELSE 0 END), 0)`,
    })
    .from(expensesTable)
    .where(and(eq(expensesTable.isSaving, 1), isNull(expensesTable.savingsGoalId)))
    .groupBy(expensesTable.savingsType);

  return rows
    .filter((row): row is typeof row & { savingsType: string } => row.savingsType !== null)
    .map((row) => ({
      savingsType: row.savingsType,
      deposited: row.deposited,
      withdrawn: row.withdrawn,
      net: row.deposited - row.withdrawn,
    }));
};
