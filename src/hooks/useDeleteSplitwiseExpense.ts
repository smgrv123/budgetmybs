/**
 * useDeleteSplitwiseExpense
 *
 * Shared delete-with-Splitwise flow, used by both the transaction detail
 * screen and the chat "delete_splitwise_expense" mutation. Encapsulates:
 *  - Payer-eligibility check (fails closed if no Splitwise user is connected)
 *  - Local expense delete
 *  - Remote delete enqueued on the Splitwise push queue (never called inline —
 *    drained on next sync, matching the offline-first contract)
 */
import { enqueueFailedPush } from '@/src/services/splitwise';
import { SplitwisePushAction } from '@/src/constants/splitwise.config';
import { useExpenses } from './useExpenses';
import { useSplitwise } from './useSplitwise';

export const useDeleteSplitwiseExpense = () => {
  const { removeExpenseAsync, isRemovingExpense } = useExpenses();
  const { currentUser } = useSplitwise();

  /**
   * Returns true if the connected Splitwise user is the payer on the linked
   * expense. Fails closed: if no user is connected (disconnected/loading),
   * returns false rather than allowing the delete.
   */
  const canDeleteSplitwiseExpense = (paidByUserId: string): boolean => {
    if (!currentUser) return false;
    return String(currentUser.id) === paidByUserId;
  };

  /**
   * Deletes the local expense, then — if it was Splitwise-linked — enqueues
   * a remote delete for the next drainPushQueue() run. Never calls the
   * Splitwise API directly.
   */
  const deleteExpenseWithSplitwiseAsync = async (params: {
    expenseId: string;
    splitwiseId: string | null;
  }): Promise<void> => {
    await removeExpenseAsync(params.expenseId);
    if (params.splitwiseId) {
      await enqueueFailedPush({ action: SplitwisePushAction.DELETE, splitwiseId: params.splitwiseId });
    }
  };

  return {
    canDeleteSplitwiseExpense,
    deleteExpenseWithSplitwiseAsync,
    isDeletingExpense: isRemovingExpense,
  };
};
