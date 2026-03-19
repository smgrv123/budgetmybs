import dayjs from 'dayjs';
import { asc, eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { creditCardExpensesTable, creditCardPaymentsTable, creditCardsTable, expensesTable } from '../schema';
import type { CreateCreditCardInput, CreditCardSummary, UpdateCreditCardInput } from '../schema-types';

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

export const deleteCreditCard = async (id: string) => {
  await db.delete(creditCardsTable).where(eq(creditCardsTable.id, id));
};

// ============================================
// SUMMARY COMPUTATION (FIFO PAYMENT APPLY)
// ============================================

export const getCreditCardSummaries = async (activeOnly = true): Promise<CreditCardSummary[]> => {
  const cards = await getCreditCards(activeOnly);
  if (cards.length === 0) return [];

  const summaries: CreditCardSummary[] = [];

  for (const card of cards) {
    const purchaseRows = await db
      .select({
        statementMonth: creditCardExpensesTable.statementMonth,
        dueDate: creditCardExpensesTable.dueDate,
        amount: expensesTable.amount,
      })
      .from(creditCardExpensesTable)
      .leftJoin(expensesTable, eq(creditCardExpensesTable.expenseId, expensesTable.id))
      .where(eq(creditCardExpensesTable.creditCardId, card.id));

    const paymentRows = await db
      .select({
        amount: expensesTable.amount,
      })
      .from(creditCardPaymentsTable)
      .leftJoin(expensesTable, eq(creditCardPaymentsTable.expenseId, expensesTable.id))
      .where(eq(creditCardPaymentsTable.creditCardId, card.id));

    const purchasesByStatement = new Map<string, { total: number; dueDate: string }>();

    for (const row of purchaseRows) {
      const statementMonth = row.statementMonth;
      const dueDate = row.dueDate;
      const amount = row.amount ?? 0;

      if (!statementMonth || !dueDate) continue;

      const existing = purchasesByStatement.get(statementMonth);
      if (existing) {
        existing.total += amount;
        if (dayjs(dueDate).isAfter(existing.dueDate)) {
          existing.dueDate = dueDate;
        }
      } else {
        purchasesByStatement.set(statementMonth, { total: amount, dueDate });
      }
    }

    const totalPayments = paymentRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);

    const statementMonths = Array.from(purchasesByStatement.keys()).sort();

    let remainingPayments = totalPayments;
    let amountDue = 0;
    let dueDate: string | null = null;

    for (const month of statementMonths) {
      const entry = purchasesByStatement.get(month);
      if (!entry) continue;

      if (remainingPayments >= entry.total) {
        remainingPayments -= entry.total;
        continue;
      }

      amountDue = entry.total - remainingPayments;
      dueDate = entry.dueDate;
      remainingPayments = 0;
      break;
    }

    const usedAmount = Math.max(0, card.usedAmount ?? 0);
    const creditLimit = card.creditLimit ?? 0;
    const utilizationPercent = creditLimit > 0 ? Math.round((usedAmount / creditLimit) * 100) : 0;

    summaries.push({
      cardId: card.id,
      usedAmount,
      creditLimit,
      utilizationPercent,
      amountDue,
      dueDate,
    });
  }

  return summaries;
};
