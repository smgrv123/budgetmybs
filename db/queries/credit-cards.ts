import dayjs from 'dayjs';
import { and, asc, count, eq, sql } from 'drizzle-orm';

import { db } from '../client';
import {
  categoriesTable,
  creditCardExpensesTable,
  creditCardPaymentsTable,
  creditCardsTable,
  expensesTable,
} from '../schema';
import type {
  CreateCreditCardInput,
  CreateCreditCardPaymentInput,
  CreditCardSummary,
  UpdateCreditCardInput,
} from '../schema-types';
import { CategoryTypeEnum, CreditCardTxnTypeEnum } from '../types';
import { getCurrentDate, getCurrentMonth, getMonthFromDate } from '../utils';

// ============================================
// CRUD: CREDIT CARDS
// ============================================

export const getCreditCards = async (activeOnly = true) => {
  if (activeOnly) {
    return db
      .select()
      .from(creditCardsTable)
      .where(eq(creditCardsTable.isActive, 1))
      .orderBy(asc(creditCardsTable.createdAt));
  }
  return db.select().from(creditCardsTable).orderBy(asc(creditCardsTable.createdAt));
};

export const createCreditCard = async (data: CreateCreditCardInput) => {
  const result = await db
    .insert(creditCardsTable)
    .values({
      ...data,
    })
    .returning();

  return result[0];
};

export const updateCreditCard = async (id: string, updateData: UpdateCreditCardInput) => {
  const result = await db
    .update(creditCardsTable)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(creditCardsTable.id, id))
    .returning();

  return result[0];
};

export const getCreditCardLinkedTransactionCount = async (id: string): Promise<number> => {
  const result = await db.select({ count: count() }).from(expensesTable).where(eq(expensesTable.creditCardId, id));
  return result[0]?.count ?? 0;
};

export const archiveCreditCard = async (id: string): Promise<void> => {
  await db
    .update(creditCardsTable)
    .set({ isActive: 0, usedAmount: 0, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(creditCardsTable.id, id));
};

export const unarchiveCreditCard = async (id: string): Promise<void> => {
  await db
    .update(creditCardsTable)
    .set({ isActive: 1, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(creditCardsTable.id, id));
};

export const deleteCreditCard = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx.delete(creditCardExpensesTable).where(eq(creditCardExpensesTable.creditCardId, id));
    await tx.delete(creditCardPaymentsTable).where(eq(creditCardPaymentsTable.creditCardId, id));
    await tx.delete(creditCardsTable).where(eq(creditCardsTable.id, id));
  });
};

// ============================================
// BILL PAYMENT
// ============================================

export const createCreditCardPayment = async (data: CreateCreditCardPaymentInput, description: string) => {
  const paymentDate = data.date ?? getCurrentDate();

  return db.transaction(async (tx) => {
    // Look up the Bills category
    const billsCategory = await tx
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(and(eq(categoriesTable.type, CategoryTypeEnum.BILLS), eq(categoriesTable.isActive, 1)))
      .limit(1);

    const categoryId = billsCategory[0]?.id ?? null;

    // 1. Insert expense row (excludeFromSpending = 1, creditCardTxnType = payment)
    const expenseResult = await tx
      .insert(expensesTable)
      .values({
        amount: data.amount,
        description,
        date: paymentDate,
        sourceMonth: getMonthFromDate(paymentDate),
        categoryId,
        creditCardId: data.creditCardId,
        creditCardTxnType: CreditCardTxnTypeEnum.PAYMENT,
        excludeFromSpending: 1,
        isSaving: 0,
      })
      .returning();

    const expense = expenseResult[0];
    if (!expense) throw new Error('Failed to create payment expense');

    // 2. FIFO: find the oldest unpaid statement cycle to attribute this payment to
    const purchaseRows = await tx
      .select({
        statementMonth: creditCardExpensesTable.statementMonth,
        amount: expensesTable.amount,
      })
      .from(creditCardExpensesTable)
      .leftJoin(expensesTable, eq(creditCardExpensesTable.expenseId, expensesTable.id))
      .where(eq(creditCardExpensesTable.creditCardId, data.creditCardId));

    const paymentRows = await tx
      .select({
        statementMonth: creditCardPaymentsTable.statementMonth,
        amount: expensesTable.amount,
      })
      .from(creditCardPaymentsTable)
      .leftJoin(expensesTable, eq(creditCardPaymentsTable.expenseId, expensesTable.id))
      .where(eq(creditCardPaymentsTable.creditCardId, data.creditCardId));

    // Build per-cycle totals
    const cycleMap = new Map<string, number>();
    for (const row of purchaseRows) {
      if (!row.statementMonth) continue;
      cycleMap.set(row.statementMonth, (cycleMap.get(row.statementMonth) ?? 0) + (row.amount ?? 0));
    }

    // Subtract existing payments per cycle
    for (const row of paymentRows) {
      if (!row.statementMonth) continue;
      const current = cycleMap.get(row.statementMonth) ?? 0;
      cycleMap.set(row.statementMonth, current - (row.amount ?? 0));
    }

    // Find the oldest cycle with a positive remaining balance
    const sortedCycles = Array.from(cycleMap.keys()).sort();
    let attributedMonth: string | null = null;
    for (const month of sortedCycles) {
      if ((cycleMap.get(month) ?? 0) > 0) {
        attributedMonth = month;
        break;
      }
    }

    // 3. Insert credit card payment record with FIFO-attributed statementMonth
    await tx.insert(creditCardPaymentsTable).values({
      creditCardId: data.creditCardId,
      expenseId: expense.id,
      statementMonth: attributedMonth,
    });

    // 3. Decrement usedAmount on the card
    await tx
      .update(creditCardsTable)
      .set({ usedAmount: sql`${creditCardsTable.usedAmount} - ${data.amount}` })
      .where(eq(creditCardsTable.id, data.creditCardId));

    return expense;
  });
};

// ============================================
// SUMMARY COMPUTATION (FIFO PAYMENT APPLY)
// ============================================

export const getCreditCardSummaries = async (activeOnly = true): Promise<CreditCardSummary[]> => {
  const cards = await getCreditCards(activeOnly);
  if (cards.length === 0) return [];

  const currentMonth = getCurrentMonth();

  const summaries: CreditCardSummary[] = [];

  for (const card of cards) {
    // Fetch all purchases grouped by statement cycle
    const purchaseRows = await db
      .select({
        statementMonth: creditCardExpensesTable.statementMonth,
        dueDate: creditCardExpensesTable.dueDate,
        amount: expensesTable.amount,
      })
      .from(creditCardExpensesTable)
      .leftJoin(expensesTable, eq(creditCardExpensesTable.expenseId, expensesTable.id))
      .where(eq(creditCardExpensesTable.creditCardId, card.id));

    // Fetch all payments with their FIFO-attributed cycle
    const paymentRows = await db
      .select({
        statementMonth: creditCardPaymentsTable.statementMonth,
        amount: expensesTable.amount,
      })
      .from(creditCardPaymentsTable)
      .leftJoin(expensesTable, eq(creditCardPaymentsTable.expenseId, expensesTable.id))
      .where(eq(creditCardPaymentsTable.creditCardId, card.id));

    // Build per-cycle purchase totals and due dates
    const cycleData = new Map<string, { total: number; dueDate: string }>();

    for (const row of purchaseRows) {
      if (!row.statementMonth || !row.dueDate) continue;
      const amount = row.amount ?? 0;
      const existing = cycleData.get(row.statementMonth);
      if (existing) {
        existing.total += amount;
        if (dayjs(row.dueDate).isAfter(existing.dueDate)) {
          existing.dueDate = row.dueDate;
        }
      } else {
        cycleData.set(row.statementMonth, { total: amount, dueDate: row.dueDate });
      }
    }

    // Build per-cycle payment totals
    const paymentByCycle = new Map<string, number>();
    for (const row of paymentRows) {
      if (!row.statementMonth) continue;
      paymentByCycle.set(row.statementMonth, (paymentByCycle.get(row.statementMonth) ?? 0) + (row.amount ?? 0));
    }

    // FIFO: iterate cycles oldest-first, subtract payments, accumulate unpaid
    const sortedMonths = Array.from(cycleData.keys()).sort();
    let carried = 0;
    let newPurchases = 0;
    let dueDate: string | null = null;

    for (const month of sortedMonths) {
      const entry = cycleData.get(month)!;
      const paid = paymentByCycle.get(month) ?? 0;
      const unpaid = Math.max(0, entry.total - paid);

      if (unpaid <= 0) continue;

      if (month < currentMonth) {
        // Prior closed cycle — contributes to carried balance
        carried += unpaid;
        if (!dueDate) dueDate = entry.dueDate;
      } else {
        // Current or future open cycle — contributes to new purchases
        newPurchases += unpaid;
        if (!dueDate) dueDate = entry.dueDate;
      }
    }

    const usedAmount = Math.max(0, card.usedAmount ?? 0);
    const creditLimit = card.creditLimit ?? 0;
    const utilizationPercent = creditLimit > 0 ? Math.round((usedAmount / creditLimit) * 100) : 0;

    summaries.push({
      cardId: card.id,
      usedAmount,
      creditLimit,
      utilizationPercent,
      amountDue: { carried, newPurchases, total: carried + newPurchases },
      dueDate,
    });
  }

  return summaries;
};
