/**
 * useSplitwiseExpensePush
 *
 * Thin wrapper around the Splitwise fetch-compare-push service functions used
 * by the transaction detail save flow. Components must never import
 * `src/services/` directly — this hook is the boundary, matching the pattern
 * established by `useDeleteSplitwiseExpense`.
 */
import { enqueueFailedPush, fetchSplitwiseExpense, updateSplitwiseExpenseRemote } from '@/src/services/splitwise';

export const useSplitwiseExpensePush = () => {
  return { fetchSplitwiseExpense, updateSplitwiseExpenseRemote, enqueueFailedPush };
};
