import { eq, sql } from "drizzle-orm";
import { db } from "../client";
import { savingsGoalsTable } from "../schema";
import type {
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
} from "../schema-types";

// ============================================
// GET ALL SAVINGS GOALS
// ============================================

export const getSavingsGoals = async (activeOnly = true) => {
  if (activeOnly) {
    return db
      .select()
      .from(savingsGoalsTable)
      .where(eq(savingsGoalsTable.isActive, 1));
  }
  return db.select().from(savingsGoalsTable);
};

// ============================================
// GET SAVINGS GOAL BY ID
// ============================================

export const getSavingsGoalById = async (id: string) => {
  const result = await db
    .select()
    .from(savingsGoalsTable)
    .where(eq(savingsGoalsTable.id, id))
    .limit(1);

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

export const updateSavingsGoal = async (
  id: string,
  updateData: UpdateSavingsGoalInput
) => {
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
