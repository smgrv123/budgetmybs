import type { SplitwiseExpense } from '@/db/schema-types';

export type ResolvedSettlementButtonProps =
  | { mode: 'mark-received'; amount: number; friendUserId: number; friendName: string; splitwiseExpenseId: string }
  | { mode: 'settle-up'; amount: number; friendUserId: number; friendName: string; splitwiseExpenseId: string };

/**
 * Pure function that derives SettlementButton props from a splitwiseRow + expense context.
 * Returns null when no button should be rendered.
 *
 * @param splitwiseRow   - The local splitwise_expenses row (may be null)
 * @param description    - The expense description (used as friendName, nullable)
 * @param friendFallback - String to use when description is null
 */
export const resolveSettlementButtonProps = (
  splitwiseRow: SplitwiseExpense | null | undefined,
  description: string | null,
  friendFallback: string
): ResolvedSettlementButtonProps | null => {
  if (!splitwiseRow) return null;
  if (splitwiseRow.isSettlement !== 0) return null;
  if (splitwiseRow.receivableSettled !== 0) return null;

  const friendUserId = parseInt(splitwiseRow.paidByUserId, 10);
  if (Number.isNaN(friendUserId)) return null;

  const friendName = description ?? friendFallback;

  if ((splitwiseRow.receivableAmount ?? 0) > 0) {
    return {
      mode: 'mark-received',
      amount: splitwiseRow.receivableAmount ?? 0,
      friendUserId,
      friendName,
      splitwiseExpenseId: splitwiseRow.id,
    };
  }

  if (splitwiseRow.userOwedShare - splitwiseRow.userPaidShare > 0) {
    return {
      mode: 'settle-up',
      amount: splitwiseRow.userOwedShare - splitwiseRow.userPaidShare,
      friendUserId,
      friendName,
      splitwiseExpenseId: splitwiseRow.id,
    };
  }

  return null;
};
