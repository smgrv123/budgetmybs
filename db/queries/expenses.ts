import { and, between, desc, eq, inArray, isNotNull, like, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  categoriesTable,
  creditCardExpensesTable,
  creditCardPaymentsTable,
  creditCardsTable,
  expensesTable,
  splitwiseExpensesTable,
} from '../schema';
import type { CreateExpenseInput, CreateOneOffSavingInput, Expense, UpdateExpenseInput } from '../schema-types';
import type { RecurringSourceType } from '../types';
import { CreditCardTxnTypeEnum, RecurringSourceTypeEnum } from '../types';
import {
  computeStatementFieldsForPurchase,
  getCurrentDate,
  getCurrentMonth,
  getMonthFromDate,
  makeRecurringKey,
} from '../utils';

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

export const getExpensesByMonth = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select()
    .from(expensesTable)
    .where(and(like(expensesTable.date, `${targetMonth}%`), eq(expensesTable.isSaving, 0)))
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
      creditCardId: expensesTable.creditCardId,
      creditCardTxnType: expensesTable.creditCardTxnType,
      createdAt: expensesTable.createdAt,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
      },
      creditCard: {
        nickname: creditCardsTable.nickname,
        last4: creditCardsTable.last4,
        provider: creditCardsTable.provider,
      },
    })
    .from(expensesTable)
    .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
    .leftJoin(creditCardsTable, eq(expensesTable.creditCardId, creditCardsTable.id))
    .where(and(like(expensesTable.date, `${targetMonth}%`), eq(expensesTable.isSaving, 0)))
    .orderBy(desc(expensesTable.date));
};

// ============================================
// GET SINGLE EXPENSE BY ID (with category join)
// ============================================

/**
 * Fetch a single expense by ID, joined with its category.
 * Returns null if not found.
 */
export const getExpenseById = async (id: string) => {
  const result = await db
    .select({
      id: expensesTable.id,
      amount: expensesTable.amount,
      description: expensesTable.description,
      date: expensesTable.date,
      wasImpulse: expensesTable.wasImpulse,
      isSaving: expensesTable.isSaving,
      savingsType: expensesTable.savingsType,
      categoryId: expensesTable.categoryId,
      sourceType: expensesTable.sourceType,
      sourceId: expensesTable.sourceId,
      creditCardId: expensesTable.creditCardId,
      creditCardTxnType: expensesTable.creditCardTxnType,
      createdAt: expensesTable.createdAt,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
      },
      creditCard: {
        nickname: creditCardsTable.nickname,
        last4: creditCardsTable.last4,
        provider: creditCardsTable.provider,
      },
    })
    .from(expensesTable)
    .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
    .leftJoin(creditCardsTable, eq(expensesTable.creditCardId, creditCardsTable.id))
    .where(eq(expensesTable.id, id))
    .limit(1);

  return result[0] ?? null;
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
    .where(
      and(
        like(expensesTable.date, `${targetMonth}%`),
        eq(expensesTable.isSaving, 0),
        eq(expensesTable.excludeFromSpending, 0)
      )
    );

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
    .where(
      and(
        like(expensesTable.date, `${targetMonth}%`),
        eq(expensesTable.isSaving, 0),
        eq(expensesTable.excludeFromSpending, 0)
      )
    )
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
    .where(
      and(
        like(expensesTable.date, `${targetMonth}%`),
        eq(expensesTable.wasImpulse, 1),
        eq(expensesTable.isSaving, 0),
        eq(expensesTable.excludeFromSpending, 0)
      )
    );

  return {
    total: result[0]?.total ?? 0,
    count: result[0]?.count ?? 0,
  };
};

// ============================================
// CREATE EXPENSE
// ============================================

export const createExpense = async (data: CreateExpenseInput) => {
  const values = buildExpenseValues(data);

  return db.transaction(async (tx) => {
    const result = await tx.insert(expensesTable).values(values).returning();
    const expense = result[0];

    if (expense?.creditCardId && expense.creditCardTxnType === CreditCardTxnTypeEnum.PURCHASE) {
      const cardRows = await tx
        .select({
          statementDayOfMonth: creditCardsTable.statementDayOfMonth,
          paymentBufferDays: creditCardsTable.paymentBufferDays,
        })
        .from(creditCardsTable)
        .where(eq(creditCardsTable.id, expense.creditCardId))
        .limit(1);

      const card = cardRows[0];
      if (!card) {
        throw new Error(`Credit card not found: ${expense.creditCardId}`);
      }

      const { statementMonth, statementEndDate, dueDate } = computeStatementFieldsForPurchase(
        expense.date,
        card.statementDayOfMonth,
        card.paymentBufferDays
      );

      await tx.insert(creditCardExpensesTable).values({
        creditCardId: expense.creditCardId,
        expenseId: expense.id,
        statementMonth,
        statementEndDate,
        dueDate,
      });

      await tx
        .update(creditCardsTable)
        .set({ usedAmount: sql`${creditCardsTable.usedAmount} + ${expense.amount}` })
        .where(eq(creditCardsTable.id, expense.creditCardId));
    }

    return expense;
  });
};

/**
 * Build the full insert values for an expense row.
 * Shared by createExpense() and the recurring engine's atomic transaction.
 */
export const buildExpenseValues = (data: CreateExpenseInput) => {
  const actualDate = data.date ?? getCurrentDate();
  const computedSourceMonth = getMonthFromDate(actualDate);
  const creditCardId = data.creditCardId ?? null;
  const creditCardTxnType = creditCardId ? (data.creditCardTxnType ?? CreditCardTxnTypeEnum.PURCHASE) : null;

  return {
    amount: data.amount,
    categoryId: data.categoryId ?? null,
    description: data.description ?? null,
    date: actualDate,
    creditCardId,
    creditCardTxnType,
    excludeFromSpending: data.excludeFromSpending ?? 0,
    wasImpulse: data.wasImpulse ?? 0,
    isSaving: data.isSaving ?? 0,
    savingsType: data.savingsType ?? null,
    customSavingsType: data.customSavingsType ?? null,
    savingsGoalId: data.savingsGoalId ?? null,
    isWithdrawal: data.isWithdrawal ?? 0,
    sourceType: data.sourceType ?? null,
    sourceId: data.sourceId ?? null,
    sourceMonth: data.sourceMonth ?? computedSourceMonth,
  };
};

// ============================================
// UPDATE EXPENSE
// ============================================

export const updateExpense = async (
  id: string,
  updateData: UpdateExpenseInput
): Promise<{ expense: Expense | undefined; newUsedAmount: number | null }> => {
  return db.transaction(async (tx) => {
    const existingRows = await tx.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    const current = existingRows[0];
    if (!current) return { expense: undefined, newUsedAmount: null };

    const updates = { ...updateData };
    if (updateData.date) {
      updates.sourceMonth = getMonthFromDate(updateData.date);
    }

    const result = await tx.update(expensesTable).set(updates).where(eq(expensesTable.id, id)).returning();
    const updated = result[0];

    let newUsedAmount: number | null = null;

    if (current.creditCardId && updateData.amount !== undefined) {
      const delta = updateData.amount - current.amount;
      if (delta !== 0) {
        // Purchases add to usedAmount; payments reduce it — so a payment edit inverts the delta
        const adjustedDelta = current.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT ? -delta : delta;
        const cardResult = await tx
          .update(creditCardsTable)
          .set({ usedAmount: sql`${creditCardsTable.usedAmount} + ${adjustedDelta}` })
          .where(eq(creditCardsTable.id, current.creditCardId))
          .returning({ usedAmount: creditCardsTable.usedAmount });
        newUsedAmount = cardResult[0]?.usedAmount ?? null;
      }
    }

    // If date changed on a purchase, recompute the statement cycle fields
    if (
      current.creditCardId &&
      current.creditCardTxnType === CreditCardTxnTypeEnum.PURCHASE &&
      updateData.date &&
      updateData.date !== current.date
    ) {
      const cardRows = await tx
        .select({
          statementDayOfMonth: creditCardsTable.statementDayOfMonth,
          paymentBufferDays: creditCardsTable.paymentBufferDays,
        })
        .from(creditCardsTable)
        .where(eq(creditCardsTable.id, current.creditCardId))
        .limit(1);
      const card = cardRows[0];
      if (card) {
        const { statementMonth, statementEndDate, dueDate } = computeStatementFieldsForPurchase(
          updateData.date,
          card.statementDayOfMonth,
          card.paymentBufferDays
        );
        await tx
          .update(creditCardExpensesTable)
          .set({ statementMonth, statementEndDate, dueDate })
          .where(eq(creditCardExpensesTable.expenseId, id));
      }
    }

    return { expense: updated, newUsedAmount };
  });
};

// ============================================
// DELETE EXPENSE
// ============================================

export const deleteExpense = async (id: string): Promise<{ newUsedAmount: number | null }> => {
  return db.transaction(async (tx) => {
    const existingRows = await tx.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    const current = existingRows[0];

    let newUsedAmount: number | null = null;

    if (current?.creditCardId) {
      if (current.creditCardTxnType === CreditCardTxnTypeEnum.PURCHASE) {
        await tx.delete(creditCardExpensesTable).where(eq(creditCardExpensesTable.expenseId, id));
        const cardResult = await tx
          .update(creditCardsTable)
          .set({ usedAmount: sql`${creditCardsTable.usedAmount} - ${current.amount}` })
          .where(eq(creditCardsTable.id, current.creditCardId))
          .returning({ usedAmount: creditCardsTable.usedAmount });
        newUsedAmount = cardResult[0]?.usedAmount ?? null;
      } else if (current.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT) {
        await tx.delete(creditCardPaymentsTable).where(eq(creditCardPaymentsTable.expenseId, id));
        // Un-payment: money is owed again, so usedAmount increases
        const cardResult = await tx
          .update(creditCardsTable)
          .set({ usedAmount: sql`${creditCardsTable.usedAmount} + ${current.amount}` })
          .where(eq(creditCardsTable.id, current.creditCardId))
          .returning({ usedAmount: creditCardsTable.usedAmount });
        newUsedAmount = cardResult[0]?.usedAmount ?? null;
      }
    }

    await tx.delete(expensesTable).where(eq(expensesTable.id, id));

    return { newUsedAmount };
  });
};

// ============================================
// ONE-OFF SAVINGS QUERIES
// ============================================

/**
 * Get one-off savings (where isSaving = 1)
 */
export const getOneOffSavings = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select()
    .from(expensesTable)
    .where(and(like(expensesTable.date, `${targetMonth}%`), eq(expensesTable.isSaving, 1)))
    .orderBy(desc(expensesTable.date));
};

/**
 * Get expenses + savings with category/card joins, supporting
 * server-side filtering and offset-based pagination.
 */
export const getAllExpensesWithCategory = async (filter?: {
  month?: string;
  categoryId?: string;
  creditCardId?: string;
  startDate?: string;
  endDate?: string;
  isSaving?: number;
  wasImpulse?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return db
    .select({
      id: expensesTable.id,
      amount: expensesTable.amount,
      description: expensesTable.description,
      date: expensesTable.date,
      wasImpulse: expensesTable.wasImpulse,
      isSaving: expensesTable.isSaving,
      savingsType: expensesTable.savingsType,
      categoryId: expensesTable.categoryId,
      sourceType: expensesTable.sourceType,
      sourceId: expensesTable.sourceId,
      creditCardId: expensesTable.creditCardId,
      creditCardTxnType: expensesTable.creditCardTxnType,
      createdAt: expensesTable.createdAt,
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
      },
      creditCard: {
        nickname: creditCardsTable.nickname,
        last4: creditCardsTable.last4,
        provider: creditCardsTable.provider,
      },
      isFromSplitwise: sql<number>`CASE WHEN ${splitwiseExpensesTable.expenseId} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(expensesTable)
    .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
    .leftJoin(creditCardsTable, eq(expensesTable.creditCardId, creditCardsTable.id))
    .leftJoin(splitwiseExpensesTable, eq(expensesTable.id, splitwiseExpensesTable.expenseId))
    .where(
      and(
        filter?.month ? like(expensesTable.date, `${filter.month}%`) : undefined,
        filter?.categoryId ? eq(expensesTable.categoryId, filter.categoryId) : undefined,
        filter?.creditCardId ? eq(expensesTable.creditCardId, filter.creditCardId) : undefined,
        filter?.startDate ? sql`${expensesTable.date} >= ${filter.startDate}` : undefined,
        filter?.endDate ? sql`${expensesTable.date} <= ${filter.endDate}` : undefined,
        filter?.isSaving !== undefined ? eq(expensesTable.isSaving, filter.isSaving) : undefined,
        filter?.wasImpulse === true ? eq(expensesTable.wasImpulse, 1) : undefined
      )
    )
    .orderBy(desc(expensesTable.date))
    .limit(filter?.limit ?? 30)
    .offset(filter?.offset ?? 0);
};

/**
 * Get total saved by month (one-off savings only)
 */
export const getTotalSavedByMonth = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  const result = await db
    .select({
      total: sql<number>`SUM(${expensesTable.amount})`,
    })
    .from(expensesTable)
    .where(and(like(expensesTable.date, `${targetMonth}%`), eq(expensesTable.isSaving, 1)));

  return result[0]?.total ?? 0;
};

/**
 * Create a one-off saving entry
 */
export const createOneOffSaving = async (data: CreateOneOffSavingInput) => {
  const actualDate = data.date ?? getCurrentDate();
  const computedSourceMonth = getMonthFromDate(actualDate);

  const result = await db
    .insert(expensesTable)
    .values({
      amount: data.amount,
      categoryId: null,
      description: data.description ?? null,
      date: actualDate,
      wasImpulse: 0,
      isSaving: 1,
      savingsType: data.savingsType,
      customSavingsType: data.customSavingsType ?? null,
      sourceMonth: computedSourceMonth,
    })
    .returning();

  return result[0];
};

// ============================================
// RECURRING TRANSACTION QUERIES
// ============================================

/**
 * Check if a recurring item has been processed for a given month
 */
export const isRecurringProcessed = async (sourceType: RecurringSourceType, sourceId: string, month: string) => {
  const result = await db
    .select({ id: expensesTable.id })
    .from(expensesTable)
    .where(
      and(
        eq(expensesTable.sourceType, sourceType),
        eq(expensesTable.sourceId, sourceId),
        eq(expensesTable.sourceMonth, month)
      )
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Load all processed recurring keys for a given month in one query (batch dedup)
 * Returns a Set of "sourceType:sourceId" strings for fast lookup
 */
export const getProcessedRecurringKeys = async (month: string): Promise<Set<string>> => {
  const rows = await db
    .select({
      sourceType: expensesTable.sourceType,
      sourceId: expensesTable.sourceId,
    })
    .from(expensesTable)
    .where(
      and(isNotNull(expensesTable.sourceType), isNotNull(expensesTable.sourceId), eq(expensesTable.sourceMonth, month))
    );

  return new Set(rows.map((r) => makeRecurringKey(r.sourceType!, r.sourceId!)));
};

/**
 * Get all processed recurring items for a given month
 */
export const getProcessedRecurringByMonth = async (month?: string) => {
  const targetMonth = month ?? getCurrentMonth();

  return db
    .select()
    .from(expensesTable)
    .where(and(isNotNull(expensesTable.sourceType), eq(expensesTable.sourceMonth, targetMonth)))
    .orderBy(desc(expensesTable.date));
};

/**
 * Get the last processed recurring month (anchor for engine month selection)
 * Returns the max sourceMonth among recurring expenses, or null if none exist
 */
export const getLastProcessedRecurringMonth = async (): Promise<string | null> => {
  const result = await db
    .select({ sourceMonth: expensesTable.sourceMonth })
    .from(expensesTable)
    .where(
      and(
        inArray(expensesTable.sourceType, [RecurringSourceTypeEnum.FIXED_EXPENSE, RecurringSourceTypeEnum.DEBT_EMI]),
        isNotNull(expensesTable.sourceId)
      )
    )
    .orderBy(desc(expensesTable.sourceMonth))
    .limit(1);

  return result[0]?.sourceMonth ?? null;
};
