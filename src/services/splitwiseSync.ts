import { upsertSplitwiseExpense } from '@/db/queries/expenses';
import { CategoryTypeEnum } from '@/db/types';
import { db } from '@/db/client';
import { categoriesTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CategoryType } from '@/db/types';
import { getSplitwiseUser } from '@/src/config/splitwise';
import { initializeSplitwiseClient, withSilentReauth } from '@/src/services/splitwise';
import type { Client } from 'splitwise-ts';

// ─── Category mapping ─────────────────────────────────────────────────────────
// Maps Splitwise parent category names → budgetmybs CategoryType.
// Matching is case-insensitive on the first word.

const SPLITWISE_CATEGORY_MAP: Record<string, CategoryType> = {
  food: CategoryTypeEnum.FOOD,
  groceries: CategoryTypeEnum.FOOD,
  entertainment: CategoryTypeEnum.ENTERTAINMENT,
  games: CategoryTypeEnum.ENTERTAINMENT,
  movies: CategoryTypeEnum.ENTERTAINMENT,
  music: CategoryTypeEnum.ENTERTAINMENT,
  sports: CategoryTypeEnum.FITNESS,
  fitness: CategoryTypeEnum.FITNESS,
  transportation: CategoryTypeEnum.TRAVEL,
  travel: CategoryTypeEnum.TRAVEL,
  lodging: CategoryTypeEnum.TRAVEL,
  health: CategoryTypeEnum.HEALTHCARE,
  medical: CategoryTypeEnum.HEALTHCARE,
  shopping: CategoryTypeEnum.SHOPPING,
  clothing: CategoryTypeEnum.SHOPPING,
  electronics: CategoryTypeEnum.SHOPPING,
  education: CategoryTypeEnum.EDUCATION,
  personal: CategoryTypeEnum.PERSONAL_CARE,
  gifts: CategoryTypeEnum.GIFTS,
  charity: CategoryTypeEnum.GIFTS,
};

const mapSplitwiseCategory = (categoryName: string | undefined): CategoryType => {
  if (!categoryName) return CategoryTypeEnum.OTHER;
  const lower = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(SPLITWISE_CATEGORY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return CategoryTypeEnum.OTHER;
};

// Finds the local category ID for a given CategoryType
const findLocalCategoryId = async (type: CategoryType): Promise<string | null> => {
  const result = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(and(eq(categoriesTable.type, type), eq(categoriesTable.isActive, 1)))
    .limit(1);
  return result[0]?.id ?? null;
};

// ─── Sync logic ───────────────────────────────────────────────────────────────

const runSync = async (client: Client): Promise<void> => {
  const storedUser = await getSplitwiseUser();
  if (!storedUser) throw new Error('Splitwise user not found — connect first.');

  const currentUserId = parseInt(storedUser.id, 10);

  // Fetch recent expenses — Splitwise API max limit is 20 per call
  // We fetch with offset pagination until we get all INR expenses
  let offset = 0;
  const limit = 20;
  let hasMore = true;

  while (hasMore) {
    const response = await client.expenses.getExpenses({ limit, offset });
    const expenses = response?.expenses ?? [];

    if (expenses.length < limit) hasMore = false;
    offset += limit;

    for (const expense of expenses) {
      // Skip deleted expenses
      if (expense.deleted_at) continue;

      // Skip non-INR expenses
      if (expense.currency_code !== 'INR') continue;

      // Skip payment entries (debt settlements between users)
      if (expense.payment) continue;

      // Find current user's share in this expense
      const userEntry = expense.users?.find((u) => u.user_id === currentUserId);
      if (!userEntry) continue;

      const owedShare = parseFloat(userEntry.owed_share ?? '0');
      const paidShare = parseFloat(userEntry.paid_share ?? '0');

      // Skip if user has no stake in this expense
      if (owedShare === 0 && paidShare === 0) continue;

      // Map category
      const categoryType = mapSplitwiseCategory(expense.category?.name);
      const categoryId = await findLocalCategoryId(categoryType);

      // Compute receivable: positive only when user paid more than they owe
      const rawReceivable = paidShare - owedShare;
      const receivableAmount = rawReceivable > 0.001 ? rawReceivable : null;

      // Normalize date to YYYY-MM-DD
      const date = expense.date ? expense.date.split('T')[0]! : new Date().toISOString().split('T')[0]!;

      await upsertSplitwiseExpense({
        splitwiseId: String(expense.id),
        amount: owedShare,
        categoryId,
        description: expense.description ?? null,
        date,
        receivableAmount,
      });
    }

    // Safety cap: don't fetch more than 200 expenses per sync
    if (offset >= 200) hasMore = false;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Syncs Splitwise expenses into the local SQLite database.
 * Uses silent re-auth if the token is expired.
 * Returns true on success, false if not connected.
 */
export const syncSplitwiseExpenses = async (): Promise<boolean> => {
  const client = await initializeSplitwiseClient();
  if (!client) return false;

  const result = await withSilentReauth(runSync);
  return result !== null;
};
