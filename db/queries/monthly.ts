import { eq, like, sql } from "drizzle-orm";
import { db } from "../client";
import {
  categoriesTable,
  expensesTable,
  monthlySnapshotsTable,
} from "../schema";
import type { CreateMonthlySnapshotInput } from "../schema-types";
import { getCurrentMonth, getPreviousMonth } from "../utils";
import { getTotalMonthlyEmi } from "./debts";
import { getTotalSpentByMonth } from "./expenses";
import { getTotalFixedExpenses } from "./fixed-expenses";
import { getTotalMonthlySavingsTarget } from "./savings";

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

export const createMonthlySnapshot = async (
  data: CreateMonthlySnapshotInput
) => {
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
// INITIALIZE CURRENT MONTH (if not exists)
// ============================================

export const initializeCurrentMonth = async (frivolousBudget: number) => {
  const currentMonth = getCurrentMonth();
  const existing = await getMonthlySnapshot(currentMonth);

  if (existing) {
    return existing;
  }

  const prevMonth = getPreviousMonth(currentMonth);
  const previousSnapshot = await getMonthlySnapshot(prevMonth);
  let rollover = 0;

  if (previousSnapshot && !previousSnapshot.isClosed) {
    const prevSpent = await getTotalSpentByMonth(prevMonth);
    const totalBudget =
      previousSnapshot.frivolousBudget + previousSnapshot.rolloverFromPrevious;
    rollover = Math.max(0, totalBudget - prevSpent);
    await closeMonth(prevMonth);
  }

  return createMonthlySnapshot({
    month: currentMonth,
    frivolousBudget,
    rolloverFromPrevious: rollover,
  });
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

  const spent = await getTotalSpentByMonth(targetMonth);
  const totalBudget = snapshot.frivolousBudget + snapshot.rolloverFromPrevious;

  return {
    totalBudget,
    spent,
    remaining: totalBudget - spent,
    isOverBudget: spent > totalBudget,
    rollover: snapshot.rolloverFromPrevious,
  };
};

// ============================================
// GET COMPLETE MONTHLY SUMMARY
// ============================================

export const getMonthlySummary = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const [snapshot, variableSpent, fixedTotal, emiTotal, savingsTarget] =
    await Promise.all([
      getMonthlySnapshot(targetMonth),
      getTotalSpentByMonth(targetMonth),
      getTotalFixedExpenses(),
      getTotalMonthlyEmi(),
      getTotalMonthlySavingsTarget(),
    ]);

  const frivolousBudget = snapshot?.frivolousBudget ?? 0;
  const rollover = snapshot?.rolloverFromPrevious ?? 0;
  const totalFrivolousBudget = frivolousBudget + rollover;
  const totalOutflow = fixedTotal + emiTotal + savingsTarget + variableSpent;

  return {
    month: targetMonth,
    frivolousBudget,
    rollover,
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

  const [fixedTotal, emiTotal, savingsTarget, categoryBreakdown] =
    await Promise.all([
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
        .leftJoin(
          categoriesTable,
          eq(expensesTable.categoryId, categoriesTable.id)
        )
        .where(like(expensesTable.date, `${targetMonth}%`))
        .groupBy(expensesTable.categoryId),
    ]);

  const pieData = [
    {
      name: "Fixed Expenses",
      value: fixedTotal,
      color: "#FF6B6B",
      type: "fixed" as const,
    },
    {
      name: "EMI Payments",
      value: emiTotal,
      color: "#4ECDC4",
      type: "debt" as const,
    },
    {
      name: "Savings",
      value: savingsTarget,
      color: "#45B7D1",
      type: "savings" as const,
    },
    ...categoryBreakdown.map((cat) => ({
      name: cat.categoryName ?? "Unknown",
      value: cat.total,
      color: cat.categoryColor ?? "#B0B0B0",
      type: "variable" as const,
    })),
  ].filter((item) => item.value > 0);

  return pieData;
};

// ============================================
// UPDATE MONTHLY SNAPSHOT BUDGET
// ============================================

export const updateMonthlySnapshotBudget = async (
  month: string,
  frivolousBudget: number
) => {
  await db
    .update(monthlySnapshotsTable)
    .set({
      frivolousBudget,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(monthlySnapshotsTable.month, month));
};
