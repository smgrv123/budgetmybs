import { db } from '../client';
import {
  categoriesTable,
  debtsTable,
  expensesTable,
  fixedExpensesTable,
  monthlySnapshotsTable,
  profileTable,
  savingsGoalsTable,
} from '../schema';

// ============================================
// CLEAR USER DATA
// ============================================

type ClearDataMode = 'reset' | 'delete';

interface ClearDataResult {
  success: boolean;
  message: string;
}

/**
 * Clears user data from the database atomically
 * Uses a transaction to ensure partial deletion cannot occur
 *
 * @param mode - "reset" (default): Preserves categories, "delete": Removes everything
 * @returns Result object with success status and message
 */
export const clearUserData = async (mode: ClearDataMode = 'reset'): Promise<ClearDataResult> => {
  try {
    await db.transaction(async (tx) => {
      // Delete in order to handle any potential dependencies
      await tx.delete(expensesTable);
      await tx.delete(monthlySnapshotsTable);
      await tx.delete(savingsGoalsTable);
      await tx.delete(debtsTable);
      await tx.delete(fixedExpensesTable);
      await tx.delete(profileTable);

      // Only delete categories if full deletion requested
      if (mode === 'delete') {
        await tx.delete(categoriesTable);
      }
    });

    const message = mode === 'delete' ? 'Account deleted successfully' : 'Data reset successfully';

    return { success: true, message };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to clear data: ${errorMessage}`,
    };
  }
};
