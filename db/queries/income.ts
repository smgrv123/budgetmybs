import { desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../client';
import { additionalIncomeTable } from '../schema';
import type { CreateIncomeInput, UpdateIncomeInput } from '../schema-types';
import { getCurrentDate, getCurrentMonth } from '../utils';

// ============================================
// GET INCOME BY MONTH
// ============================================

export const getIncomeByMonth = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select()
    .from(additionalIncomeTable)
    .where(like(additionalIncomeTable.date, `${targetMonth}%`))
    .orderBy(desc(additionalIncomeTable.date));
};

// ============================================
// GET MONTHLY INCOME SUM
// ============================================

/**
 * Sum all income entries for a given month.
 * Used in the budget formula: frivolousBudget + rolloverFromPrevious + SUM(income for month).
 */
export const getMonthlyIncomeSum = async (month?: string): Promise<number> => {
  const targetMonth = month ?? getCurrentMonth();

  const result = await db
    .select({
      total: sql<number>`SUM(${additionalIncomeTable.amount})`,
    })
    .from(additionalIncomeTable)
    .where(like(additionalIncomeTable.date, `${targetMonth}%`));

  return result[0]?.total ?? 0;
};

// ============================================
// CREATE INCOME
// ============================================

export const createIncome = async (data: CreateIncomeInput) => {
  const actualDate = data.date ?? getCurrentDate();

  const result = await db
    .insert(additionalIncomeTable)
    .values({
      amount: data.amount,
      type: data.type,
      customType: data.customType ?? null,
      date: actualDate,
      description: data.description ?? null,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE INCOME
// ============================================

export const updateIncome = async (id: string, data: UpdateIncomeInput) => {
  const result = await db.update(additionalIncomeTable).set(data).where(eq(additionalIncomeTable.id, id)).returning();

  return result[0];
};

// ============================================
// DELETE INCOME
// ============================================

export const deleteIncome = async (id: string) => {
  await db.delete(additionalIncomeTable).where(eq(additionalIncomeTable.id, id));
};
