import { and, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { fixedExpensesTable } from "../schema";
import type {
  CreateFixedExpenseInput,
  UpdateFixedExpenseInput,
} from "../schema-types";
import type { FixedExpenseType } from "../types";

// ============================================
// GET ALL FIXED EXPENSES
// ============================================

export const getFixedExpenses = async (activeOnly = true) => {
  if (activeOnly) {
    return db
      .select()
      .from(fixedExpensesTable)
      .where(eq(fixedExpensesTable.isActive, 1));
  }
  return db.select().from(fixedExpensesTable);
};

// ============================================
// GET FIXED EXPENSES BY TYPE
// ============================================

export const getFixedExpensesByType = async (type: FixedExpenseType) => {
  return db
    .select()
    .from(fixedExpensesTable)
    .where(
      and(eq(fixedExpensesTable.type, type), eq(fixedExpensesTable.isActive, 1))
    );
};

// ============================================
// GET TOTAL FIXED EXPENSES
// ============================================

export const getTotalFixedExpenses = async () => {
  const result = await db
    .select({
      total: sql<number>`SUM(${fixedExpensesTable.amount})`,
    })
    .from(fixedExpensesTable)
    .where(eq(fixedExpensesTable.isActive, 1));

  return result[0]?.total ?? 0;
};

// ============================================
// CREATE FIXED EXPENSE
// ============================================

export const createFixedExpense = async (data: CreateFixedExpenseInput) => {
  const result = await db
    .insert(fixedExpensesTable)
    .values({
      ...data,
      customType: data.customType ?? null,
      dayOfMonth: data.dayOfMonth ?? null,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE FIXED EXPENSE
// ============================================

export const updateFixedExpense = async (
  id: string,
  updateData: UpdateFixedExpenseInput
) => {
  const result = await db
    .update(fixedExpensesTable)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(fixedExpensesTable.id, id))
    .returning();

  return result[0];
};

// ============================================
// DELETE FIXED EXPENSE
// ============================================

export const deleteFixedExpense = async (id: string) => {
  await db.delete(fixedExpensesTable).where(eq(fixedExpensesTable.id, id));
};
