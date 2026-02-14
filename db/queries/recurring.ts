import dayjs from 'dayjs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { debtsTable, expensesTable } from '../schema';
import { RecurringSourceTypeEnum } from '../types';
import { formatDate, getCurrentDate, getMonthFromDate, getNextMonth, makeRecurringKey } from '../utils';
import {
  buildExpenseValues,
  createExpense,
  getLastProcessedRecurringMonth,
  getProcessedRecurringKeys,
} from './expenses';
import { getFixedExpenses } from './fixed-expenses';

/** Maximum months to auto-process without user confirmation */
const MAX_AUTO_PROCESS_MONTHS = 6;

/**
 * Helper to construct YYYY-MM-DD, clamping day to end of month if needed
 * e.g., Feb 30 -> Feb 28/29
 */
const getTargetDate = (month: string, day: number): string => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(`Invalid month format: ${month}. Expected YYYY-MM`);
  }

  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be between 1 and 31`);
  }

  const monthDate = dayjs(month);

  if (!monthDate.isValid()) {
    throw new Error(`Invalid month date: ${month}`);
  }

  const lastDay = monthDate.endOf('month').date();
  const clampedDay = Math.min(day, lastDay);

  return formatDate(monthDate.date(clampedDay));
};

/**
 * Process a single month's recurring items
 *
 * Uses batch dedup: loads all processed keys for the month upfront,
 * then checks the Set instead of querying per item.
 *
 * Debt EMI uses an atomic transaction (expense insert + debt update).
 */
const processMonthRecurring = async (month: string): Promise<{ count: number }> => {
  const currentDate = getCurrentDate();
  const currentMonth = getMonthFromDate(currentDate);
  const currentDayOfMonth = dayjs(currentDate).date();
  const isCurrentMonth = month === currentMonth;

  // Batch: load all processed keys for this month in one query
  const processedKeys = await getProcessedRecurringKeys(month);

  // Fetch all active recurring items in parallel
  const [fixedExpenses, debts] = await Promise.all([
    getFixedExpenses(true),
    db.select().from(debtsTable).where(eq(debtsTable.isActive, 1)),
  ]);

  // Helper: check dedup via in-memory Set using shared key format
  const isAlreadyProcessed = (sourceType: string, sourceId: string): boolean => {
    return processedKeys.has(makeRecurringKey(sourceType, sourceId));
  };

  // Helper: process a fixed expense (uses existing createExpense query)
  const processFixedExpense = async (item: (typeof fixedExpenses)[0]) => {
    if (isAlreadyProcessed(RecurringSourceTypeEnum.FIXED_EXPENSE, item.id)) return;

    const targetDate = getTargetDate(month, item.dayOfMonth);
    await createExpense({
      amount: item.amount,
      date: targetDate,
      description: item.name,
      sourceType: RecurringSourceTypeEnum.FIXED_EXPENSE,
      sourceId: item.id,
      sourceMonth: month,
    });
  };

  // Helper: process a debt EMI atomically (expense insert + debt update in one transaction)
  const processDebtEmi = async (item: (typeof debts)[0]) => {
    if (isAlreadyProcessed(RecurringSourceTypeEnum.DEBT_EMI, item.id)) return;

    const targetDate = getTargetDate(month, item.dayOfMonth);

    // Atomic: insert expense + update debt in a single transaction
    await db.transaction(async (tx) => {
      const values = buildExpenseValues({
        amount: item.emiAmount,
        date: targetDate,
        description: `${item.name} EMI`,
        sourceType: RecurringSourceTypeEnum.DEBT_EMI,
        sourceId: item.id,
        sourceMonth: month,
      });
      await tx.insert(expensesTable).values(values);

      const monthlyInterest = (item.remaining * item.interestRate) / 100 / 12;
      const principalPaid = item.emiAmount - monthlyInterest;
      const newRemaining = Math.max(0, item.remaining - principalPaid);
      const newRemainingMonths = Math.max(0, item.remainingMonths - 1);

      await tx
        .update(debtsTable)
        .set({
          remaining: newRemaining,
          remainingMonths: newRemainingMonths,
          isActive: newRemaining <= 0 ? 0 : 1,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(debtsTable.id, item.id));
    });
  };

  // Collect processing tasks
  const processingTasks: Promise<void>[] = [];

  // 1. Fixed Expenses
  for (const item of fixedExpenses) {
    // Current month gating: only process if due date has passed or is today
    if (isCurrentMonth && item.dayOfMonth > currentDayOfMonth) {
      continue;
    }

    processingTasks.push(processFixedExpense(item));
  }

  // 2. Debts (EMI)
  for (const item of debts) {
    if (isCurrentMonth && item.dayOfMonth > currentDayOfMonth) {
      continue;
    }

    processingTasks.push(processDebtEmi(item));
  }

  await Promise.all(processingTasks);

  return { count: processingTasks.length };
};

/**
 * Determine which months need processing
 * Strategy: Find the most recent recurring transaction in expensesTable via sourceMonth.
 * Start from the next month after that. If none found, start from current month.
 * End at current month (inclusive).
 */
export const getMonthsToProcess = async (): Promise<string[]> => {
  const currentMonth = getMonthFromDate(getCurrentDate());

  const lastProcessedMonth = await getLastProcessedRecurringMonth();

  if (!lastProcessedMonth) {
    // No recurring items yet — conservative first-run default
    return [currentMonth];
  }

  if (lastProcessedMonth >= currentMonth) {
    return [currentMonth];
  }

  // Generate inclusive range from (lastProcessedMonth + 1) to currentMonth
  const months: string[] = [];
  let iterMonth = getNextMonth(lastProcessedMonth);

  // Safety: cap at 24 months to prevent runaway loops
  let safetyCounter = 0;
  while (iterMonth <= currentMonth && safetyCounter < 24) {
    months.push(iterMonth);
    const nextIter = getNextMonth(iterMonth);
    if (nextIter <= iterMonth) break;
    iterMonth = nextIter;
    safetyCounter++;
  }

  return months.length > 0 ? months : [currentMonth];
};

/**
 * Main entry point to process all pending recurring transactions.
 *
 * @param options.allowExtendedCatchup - If true, bypasses the 6-month gate
 *
 * Returns:
 *  - `true`  → processing completed (or nothing to do) without needing confirmation
 *  - `false` → processing did NOT run because monthsToProcess > 6:
 *              the caller should show a confirmation UI and re-call with `{ allowExtendedCatchup: true }`
 *
 * Idempotent: safe to call multiple times; dedup keys prevent duplicates.
 */
export const processRecurringTransactions = async (options?: { allowExtendedCatchup?: boolean }): Promise<boolean> => {
  try {
    const monthsToProcess = await getMonthsToProcess();

    // 6-month confirmation gate (skipped if allowExtendedCatchup is true)
    if (!options?.allowExtendedCatchup && monthsToProcess.length > MAX_AUTO_PROCESS_MONTHS) {
      console.warn(
        `[Recurring] ${monthsToProcess.length} months pending (>${MAX_AUTO_PROCESS_MONTHS}). ` +
          `Requires user confirmation. Months: ${monthsToProcess.join(', ')}`
      );
      return false;
    }

    let totalCreated = 0;

    for (const month of monthsToProcess) {
      const { count } = await processMonthRecurring(month);
      totalCreated += count;
    }

    if (totalCreated > 0) {
      console.log(`[Recurring] Processed ${totalCreated} transactions for months: ${monthsToProcess.join(', ')}`);
    }

    return true;
  } catch (error) {
    console.error('[Recurring] Error processing recurring transactions:', error);
    return true; // Return true so the app doesn't block on error — items will retry next launch
  }
};
