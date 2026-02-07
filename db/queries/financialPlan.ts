import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { financialPlansTable } from '@/db/schema';
import type { CreateFinancialPlanInput, FinancialPlanRecord } from '@/db/schema-types';

/**
 * Create a new financial plan and deactivate any previous plans
 */
export const createFinancialPlan = async (input: CreateFinancialPlanInput): Promise<FinancialPlanRecord> => {
  return await db.transaction(async (tx) => {
    // Deactivate all previous plans
    await tx.update(financialPlansTable).set({ isActive: 0 }).where(eq(financialPlansTable.isActive, 1));

    // Create new plan
    const [newPlan] = await tx
      .insert(financialPlansTable)
      .values({
        profileSnapshot: JSON.stringify(input.profileSnapshot),
        fixedExpensesSnapshot: JSON.stringify(input.fixedExpensesSnapshot),
        debtsSnapshot: JSON.stringify(input.debtsSnapshot),
        savingsGoalsSnapshot: JSON.stringify(input.savingsGoalsSnapshot),
        plan: JSON.stringify(input.plan),
        isActive: 1,
      })
      .returning();

    return newPlan;
  });
};

/**
 * Get the current active financial plan
 */
export const getActiveFinancialPlan = async (): Promise<FinancialPlanRecord | null> => {
  const plan = await db.select().from(financialPlansTable).where(eq(financialPlansTable.isActive, 1)).limit(1);

  return plan[0] || null;
};

/**
 * Get all financial plans ordered by creation date (newest first)
 */
export const getAllFinancialPlans = async (): Promise<FinancialPlanRecord[]> => {
  return await db.select().from(financialPlansTable).orderBy(financialPlansTable.createdAt);
};

/**
 * Delete a financial plan by ID
 */
export const deleteFinancialPlan = async (id: string): Promise<void> => {
  await db.delete(financialPlansTable).where(eq(financialPlansTable.id, id));
};
