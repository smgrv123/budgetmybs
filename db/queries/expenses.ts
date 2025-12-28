import { and, between, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../client';
import { categoriesTable, expensesTable } from '../schema';
import type { CreateExpenseInput, UpdateExpenseInput } from '../schema-types';
import { getCurrentMonth } from '../utils';

// ============================================
// GET ALL EXPENSES
// ============================================

export const getExpenses = async (options?: {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  wasImpulse?: boolean;
  limit?: number;
}) => {
  const conditions = [];

  if (options?.categoryId) {
    conditions.push(eq(expensesTable.categoryId, options.categoryId));
  }

  if (options?.startDate && options?.endDate) {
    conditions.push(between(expensesTable.date, options.startDate, options.endDate));
  } else if (options?.startDate) {
    conditions.push(sql`${expensesTable.date} >= ${options.startDate}`);
  } else if (options?.endDate) {
    conditions.push(sql`${expensesTable.date} <= ${options.endDate}`);
  }

  if (options?.wasImpulse !== undefined) {
    conditions.push(eq(expensesTable.wasImpulse, options.wasImpulse ? 1 : 0));
  }

  if (conditions.length > 0) {
    return db
      .select()
      .from(expensesTable)
      .where(and(...conditions))
      .orderBy(desc(expensesTable.date))
      .limit(options?.limit ?? 100);
  }

  return db
    .select()
    .from(expensesTable)
    .orderBy(desc(expensesTable.date))
    .limit(options?.limit ?? 100);
};

// ============================================
// GET EXPENSES BY MONTH
// ============================================

export const getExpensesByMonth = async (month: string) => {
  return db
    .select()
    .from(expensesTable)
    .where(like(expensesTable.date, `${month}%`))
    .orderBy(desc(expensesTable.date));
};

// ============================================
// GET EXPENSES WITH CATEGORY (JOIN)
// ============================================

export const getExpensesWithCategory = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select({
      id: expensesTable.id,
      amount: expensesTable.amount,
      description: expensesTable.description,
      date: expensesTable.date,
      wasImpulse: expensesTable.wasImpulse,
      createdAt: expensesTable.createdAt,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
      },
    })
    .from(expensesTable)
    .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
    .where(like(expensesTable.date, `${targetMonth}%`))
    .orderBy(desc(expensesTable.date));
};

// ============================================
// GET TOTAL SPENT BY MONTH
// ============================================

export const getTotalSpentByMonth = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const result = await db
    .select({
      total: sql<number>`SUM(${expensesTable.amount})`,
    })
    .from(expensesTable)
    .where(like(expensesTable.date, `${targetMonth}%`));

  return result[0]?.total ?? 0;
};

// ============================================
// GET SPENDING BY CATEGORY
// ============================================

export const getSpendingByCategory = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select({
      categoryId: expensesTable.categoryId,
      categoryName: categoriesTable.name,
      categoryIcon: categoriesTable.icon,
      categoryColor: categoriesTable.color,
      total: sql<number>`SUM(${expensesTable.amount})`,
      count: sql<number>`COUNT(${expensesTable.id})`,
    })
    .from(expensesTable)
    .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
    .where(like(expensesTable.date, `${targetMonth}%`))
    .groupBy(expensesTable.categoryId);
};

// ============================================
// GET IMPULSE PURCHASE STATS
// ============================================

export const getImpulsePurchaseStats = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const result = await db
    .select({
      total: sql<number>`SUM(${expensesTable.amount})`,
      count: sql<number>`COUNT(${expensesTable.id})`,
    })
    .from(expensesTable)
    .where(and(like(expensesTable.date, `${targetMonth}%`), eq(expensesTable.wasImpulse, 1)));

  return {
    total: result[0]?.total ?? 0,
    count: result[0]?.count ?? 0,
  };
};

// ============================================
// CREATE EXPENSE
// ============================================

export const createExpense = async (data: CreateExpenseInput) => {
  const result = await db
    .insert(expensesTable)
    .values({
      ...data,
      description: data.description ?? null,
      wasImpulse: data.wasImpulse ?? 0,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE EXPENSE
// ============================================

export const updateExpense = async (id: string, updateData: UpdateExpenseInput) => {
  const result = await db.update(expensesTable).set(updateData).where(eq(expensesTable.id, id)).returning();

  return result[0];
};

// ============================================
// DELETE EXPENSE
// ============================================

export const deleteExpense = async (id: string) => {
  await db.delete(expensesTable).where(eq(expensesTable.id, id));
};
