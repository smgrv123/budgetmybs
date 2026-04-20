/**
 * Utility to build the POST /api/v3.0/create_expense payload
 * from SplitFormState + expense data.
 *
 * MVP scope: payer (index 0) + 1 friend (index 1).
 */

import { SplitType } from '@/src/constants/splitwise-outbound.strings';
import type { SplitFormState, SplitwiseCreateExpensePayload } from '@/src/types/splitwise-outbound';

type BuildPayloadParams = {
  totalAmount: number;
  description: string;
  currencyCode: string;
  payerUserId: number;
  friendUserId: number;
  splitState: SplitFormState;
  groupId?: number;
};

/**
 * Build the flat Splitwise create_expense payload.
 * Returns null if the split data is invalid (e.g. percentages don't sum to 100).
 */
export const buildSplitPayload = ({
  totalAmount,
  description,
  currencyCode,
  payerUserId,
  friendUserId,
  splitState,
  groupId,
}: BuildPayloadParams): SplitwiseCreateExpensePayload | null => {
  const cost = totalAmount.toFixed(2);
  const base: SplitwiseCreateExpensePayload = {
    cost,
    description,
    currency_code: currencyCode,
    ...(groupId !== undefined ? { group_id: groupId } : {}),
  };

  switch (splitState.splitType) {
    case SplitType.EQUAL: {
      const half = (totalAmount / 2).toFixed(2);
      return {
        ...base,
        split_equally: true,
        users__0__user_id: payerUserId,
        users__0__paid_share: cost,
        users__0__owed_share: half,
        users__1__user_id: friendUserId,
        users__1__paid_share: '0.00',
        users__1__owed_share: half,
      };
    }

    case SplitType.EXACT: {
      const payerAmount = parseFloat(splitState.yourExactAmount);
      const friendAmount = parseFloat(splitState.friendExactAmount);
      if (isNaN(payerAmount) || isNaN(friendAmount)) return null;
      // Exact amounts must add up to total (within floating-point tolerance)
      if (Math.abs(payerAmount + friendAmount - totalAmount) > 0.01) return null;
      return {
        ...base,
        users__0__user_id: payerUserId,
        users__0__paid_share: cost,
        users__0__owed_share: payerAmount.toFixed(2),
        users__1__user_id: friendUserId,
        users__1__paid_share: '0.00',
        users__1__owed_share: friendAmount.toFixed(2),
      };
    }

    case SplitType.PERCENTAGE: {
      const yourPct = parseFloat(splitState.yourPercentage);
      const friendPct = parseFloat(splitState.friendPercentage);
      if (isNaN(yourPct) || isNaN(friendPct)) return null;
      if (Math.abs(yourPct + friendPct - 100) > 0.01) return null;
      const payerOwed = (totalAmount * yourPct) / 100;
      const friendOwed = (totalAmount * friendPct) / 100;
      return {
        ...base,
        users__0__user_id: payerUserId,
        users__0__paid_share: cost,
        users__0__owed_share: payerOwed.toFixed(2),
        users__1__user_id: friendUserId,
        users__1__paid_share: '0.00',
        users__1__owed_share: friendOwed.toFixed(2),
      };
    }

    case SplitType.SHARES: {
      const yourShares = parseFloat(splitState.yourShares);
      const friendShares = parseFloat(splitState.friendShares);
      if (isNaN(yourShares) || yourShares <= 0) return null;
      if (isNaN(friendShares) || friendShares <= 0) return null;
      const totalShares = yourShares + friendShares;
      const payerOwed = (totalAmount * yourShares) / totalShares;
      const friendOwed = (totalAmount * friendShares) / totalShares;
      return {
        ...base,
        users__0__user_id: payerUserId,
        users__0__paid_share: cost,
        users__0__owed_share: payerOwed.toFixed(2),
        users__1__user_id: friendUserId,
        users__1__paid_share: '0.00',
        users__1__owed_share: friendOwed.toFixed(2),
      };
    }

    default:
      return null;
  }
};
