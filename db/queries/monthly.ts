import { desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../client';
import { categoriesTable, expensesTable, monthlySnapshotsTable } from '../schema';
import type { CreateMonthlySnapshotInput } from '../schema-types';
import { getCurrentMonth, getNextMonth } from '../utils';
import { getTotalMonthlyEmi } from './debts';
import { getTotalSavedByMonth, getTotalSpentByMonth } from './expenses';
import { getTotalFixedExpenses } from './fixed-expenses';
import { getMonthlyIncomeSum } from './income';
import { getTotalMonthlySavingsTarget } from './savings';

const MAX_AUTO_BACKFILL_MONTHS = 6;

// ============================================
// GET MONTHLY SNAPSHOT
// ============================================

export const getMonthlySnapshot = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const result = await db
    .select()
    .from(monthlySnapshotsTable)
    .where(eq(monthlySnapshotsTable.month, targetMonth))
    .limit(1);

  return result[0] ?? null;
};

// ============================================
// CREATE MONTHLY SNAPSHOT
// ============================================

export const createMonthlySnapshot = async (data: CreateMonthlySnapshotInput) => {
  const result = await db
    .insert(monthlySnapshotsTable)
    .values({
      ...data,
      rolloverFromPrevious: data.rolloverFromPrevious ?? 0,
    })
    .returning();

  return result[0];
};

// ============================================
// GET LATEST MONTHLY SNAPSHOT
// ============================================

const getLatestMonthlySnapshot = async () => {
  const result = await db.select().from(monthlySnapshotsTable).orderBy(desc(monthlySnapshotsTable.month)).limit(1);

  return result[0] ?? null;
};

const getMonthsToBackfill = (startMonth: string, endMonth: string): string[] => {
  if (startMonth >= endMonth) return [];

  const months: string[] = [];
  let iterMonth = getNextMonth(startMonth);

  // Safety: cap at 24 months to prevent runaway loops
  let safetyCounter = 0;
  while (iterMonth <= endMonth && safetyCounter < 24) {
    months.push(iterMonth);
    const nextIter = getNextMonth(iterMonth);
    if (nextIter <= iterMonth) break;
    iterMonth = nextIter;
    safetyCounter++;
  }

  return months;
};

// ============================================
// INITIALIZE CURRENT MONTH (if not exists)
// ============================================

export const initializeCurrentMonth = async (salary: number, options?: { allowExtendedCatchup?: boolean }) => {
  const currentMonth = getCurrentMonth();
  const existing = await getMonthlySnapshot(currentMonth);

  if (existing) {
    return existing;
  }

  const lastSnapshot = await getLatestMonthlySnapshot();
  if (!lastSnapshot) {
    return createMonthlySnapshot({
      month: currentMonth,
      salary,
      frivolousBudget: salary,
      rolloverFromPrevious: 0,
    });
  }

  const monthsToBackfill = getMonthsToBackfill(lastSnapshot.month, currentMonth);
  if (!options?.allowExtendedCatchup && monthsToBackfill.length > MAX_AUTO_BACKFILL_MONTHS) {
    console.warn(
      `[Monthly] ${monthsToBackfill.length} months pending (>${MAX_AUTO_BACKFILL_MONTHS}). ` +
        `Requires user confirmation. Months: ${monthsToBackfill.join(', ')}`
    );
    return null;
  }

  let previousSnapshot = lastSnapshot;

  for (const month of monthsToBackfill) {
    const [prevSpent, prevSaved] = await Promise.all([
      getTotalSpentByMonth(previousSnapshot.month),
      getTotalSavedByMonth(previousSnapshot.month),
    ]);
    const prevBudgetBase = previousSnapshot.salary > 0 ? previousSnapshot.salary : previousSnapshot.frivolousBudget;
    const prevIncome = await getMonthlyIncomeSum(previousSnapshot.month);
    const prevBudget = prevBudgetBase + previousSnapshot.rolloverFromPrevious + prevIncome;
    const rollover = prevBudget - prevSpent - prevSaved;

    await closeMonth(previousSnapshot.month);

    const created = await createMonthlySnapshot({
      month,
      salary,
      frivolousBudget: salary,
      rolloverFromPrevious: rollover,
    });

    previousSnapshot = created;
  }

  return previousSnapshot;
};

// ============================================
// CLOSE MONTH
// ============================================

export const closeMonth = async (month: string) => {
  await db
    .update(monthlySnapshotsTable)
    .set({
      isClosed: 1,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(monthlySnapshotsTable.month, month));
};

// ============================================
// GET REMAINING FRIVOLOUS BUDGET
// ============================================

export const getRemainingFrivolousBudget = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const snapshot = await getMonthlySnapshot(targetMonth);
  if (!snapshot) {
    return null;
  }

  const [spent, additionalIncome] = await Promise.all([
    getTotalSpentByMonth(targetMonth),
    getMonthlyIncomeSum(targetMonth),
  ]);
  const totalBudget = snapshot.frivolousBudget + snapshot.rolloverFromPrevious + additionalIncome;

  return {
    totalBudget,
    spent,
    remaining: totalBudget - spent,
    isOverBudget: spent > totalBudget,
    rollover: snapshot.rolloverFromPrevious,
    additionalIncome,
  };
};

// ============================================
// GET COMPLETE MONTHLY SUMMARY
// ============================================

export const getMonthlySummary = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const [snapshot, variableSpent, fixedTotal, emiTotal, savingsTarget, additionalIncome] = await Promise.all([
    getMonthlySnapshot(targetMonth),
    getTotalSpentByMonth(targetMonth),
    getTotalFixedExpenses(),
    getTotalMonthlyEmi(),
    getTotalMonthlySavingsTarget(),
    getMonthlyIncomeSum(targetMonth),
  ]);

  const frivolousBudget = snapshot?.frivolousBudget ?? 0;
  const rollover = snapshot?.rolloverFromPrevious ?? 0;
  const totalFrivolousBudget = frivolousBudget + rollover + additionalIncome;
  const totalOutflow = fixedTotal + emiTotal + savingsTarget + variableSpent;

  return {
    month: targetMonth,
    frivolousBudget,
    rollover,
    additionalIncome,
    totalFrivolousBudget,
    variableSpent,
    remainingFrivolous: totalFrivolousBudget - variableSpent,
    fixedExpenses: fixedTotal,
    emiPayments: emiTotal,
    savingsTarget,
    totalOutflow,
    isClosed: snapshot?.isClosed === 1,
  };
};

// ============================================
// GET PIE CHART DATA (All outflows)
// ============================================

export const getPieChartData = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const [fixedTotal, emiTotal, savingsTarget, categoryBreakdown] = await Promise.all([
    getTotalFixedExpenses(),
    getTotalMonthlyEmi(),
    getTotalMonthlySavingsTarget(),
    db
      .select({
        categoryId: expensesTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        total: sql<number>`SUM(${expensesTable.amount})`,
      })
      .from(expensesTable)
      .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
      .where(like(expensesTable.date, `${targetMonth}%`))
      .groupBy(expensesTable.categoryId),
  ]);

  const pieData = [
    {
      name: 'Fixed Expenses',
      value: fixedTotal,
      color: '#FF6B6B',
      type: 'fixed' as const,
    },
    {
      name: 'EMI Payments',
      value: emiTotal,
      color: '#4ECDC4',
      type: 'debt' as const,
    },
    {
      name: 'Savings',
      value: savingsTarget,
      color: '#45B7D1',
      type: 'savings' as const,
    },
    ...categoryBreakdown.map((cat) => ({
      name: cat.categoryName ?? 'Unknown',
      value: cat.total,
      color: cat.categoryColor ?? '#B0B0B0',
      type: 'variable' as const,
    })),
  ].filter((item) => item.value > 0);

  return pieData;
};

// ============================================
// UPDATE MONTHLY SNAPSHOT BUDGET
// ============================================

export const updateMonthlySnapshotBudget = async (month: string, frivolousBudget: number) => {
  await db
    .update(monthlySnapshotsTable)
    .set({
      frivolousBudget,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(monthlySnapshotsTable.month, month));
};

// ============================================
// RESET ROLLOVER FOR CURRENT MONTH
// ============================================

export const resetRollover = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  await db
    .update(monthlySnapshotsTable)
    .set({
      rolloverFromPrevious: 0,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(monthlySnapshotsTable.month, targetMonth));
};
