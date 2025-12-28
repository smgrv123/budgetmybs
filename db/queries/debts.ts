import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { debtsTable } from '../schema';
import type { CreateDebtInput, UpdateDebtInput } from '../schema-types';

// ============================================
// GET ALL DEBTS
// ============================================

export const getDebts = async (activeOnly = true) => {
  if (activeOnly) {
    return db.select().from(debtsTable).where(eq(debtsTable.isActive, 1));
  }
  return db.select().from(debtsTable);
};

// ============================================
// GET DEBT BY ID
// ============================================

export const getDebtById = async (id: string) => {
  const result = await db.select().from(debtsTable).where(eq(debtsTable.id, id)).limit(1);

  return result[0] ?? null;
};

// ============================================
// GET TOTAL MONTHLY EMI
// ============================================

export const getTotalMonthlyEmi = async () => {
  const result = await db
    .select({
      total: sql<number>`SUM(${debtsTable.emiAmount})`,
    })
    .from(debtsTable)
    .where(eq(debtsTable.isActive, 1));

  return result[0]?.total ?? 0;
};

// ============================================
// GET TOTAL REMAINING DEBT
// ============================================

export const getTotalRemainingDebt = async () => {
  const result = await db
    .select({
      total: sql<number>`SUM(${debtsTable.remaining})`,
    })
    .from(debtsTable)
    .where(eq(debtsTable.isActive, 1));

  return result[0]?.total ?? 0;
};

// ============================================
// CREATE DEBT
// ============================================

export const createDebt = async (data: CreateDebtInput) => {
  const result = await db
    .insert(debtsTable)
    .values({
      ...data,
      customType: data.customType ?? null,
      startDate: data.startDate ?? null,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE DEBT
// ============================================

export const updateDebt = async (id: string, updateData: UpdateDebtInput) => {
  const result = await db
    .update(debtsTable)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(debtsTable.id, id))
    .returning();

  return result[0];
};

// ============================================
// MAKE EMI PAYMENT (Reduce remaining balance)
// ============================================

export const makeEmiPayment = async (id: string) => {
  const debt = await getDebtById(id);
  if (!debt) throw new Error('Debt not found');

  const monthlyInterest = (debt.remaining * debt.interestRate) / 100 / 12;
  const principalPaid = debt.emiAmount - monthlyInterest;
  const newRemaining = Math.max(0, debt.remaining - principalPaid);
  const newRemainingMonths = Math.max(0, debt.remainingMonths - 1);

  await db
    .update(debtsTable)
    .set({
      remaining: newRemaining,
      remainingMonths: newRemainingMonths,
      isActive: newRemaining <= 0 ? 0 : 1,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(debtsTable.id, id));

  return {
    interestPaid: monthlyInterest,
    principalPaid,
    newRemaining,
    newRemainingMonths,
    isPaidOff: newRemaining <= 0,
  };
};

// ============================================
// DELETE DEBT
// ============================================

export const deleteDebt = async (id: string) => {
  await db.delete(debtsTable).where(eq(debtsTable.id, id));
};
