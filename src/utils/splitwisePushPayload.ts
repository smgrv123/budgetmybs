/**
 * Utility to build the POST /api/v3.0/create_expense payload
 * from SplitFormState + expense data.
 *
 * Phase 13a: upgraded to support N-person splits (equal, exact, percentage, shares).
 * Payer (index 0) pays the full cost and owes their own share.
 * Each additional member (indices 1..N) pays 0 and owes their share.
 * Members not in the split are silently excluded (owed_share = "0.00").
 */

import { SplitType } from '@/src/constants/splitwise-outbound.strings';
import type { SplitFormState, SplitwiseCreateExpensePayload } from '@/src/types/splitwise-outbound';

// ============================================
// TYPES
// ============================================

export type BuildPayloadParams = {
  totalAmount: number;
  description: string;
  currencyCode: string;
  /** Splitwise user ID of the current user (payer) */
  payerUserId: number;
  /**
   * Splitwise user IDs of all participants (payer included or not —
   * the builder always places the payer at index 0 and deduplicates).
   * Must be non-empty; the participants.length < 2 guard enforces at least one other person.
   */
  participantUserIds: number[];
  splitState: SplitFormState;
  groupId?: number;
};

// ============================================
// INTERNAL HELPERS
// ============================================

/** Resolve the ordered participant list: payer first, then the rest. */
const resolveParticipants = (payerUserId: number, participantUserIds: number[]): number[] => {
  // Remove payer from participant list to avoid duplicates, then prepend
  const others = participantUserIds.filter((id) => id !== payerUserId);
  return [payerUserId, ...others];
};

/** Inject a user's fields at Splitwise flat-payload index. */
const userFields = (index: number, userId: number, paidShare: string, owedShare: string): Record<string, unknown> => ({
  [`users__${index}__user_id`]: userId,
  [`users__${index}__paid_share`]: paidShare,
  [`users__${index}__owed_share`]: owedShare,
});

// ============================================
// PAYLOAD BUILDER
// ============================================

/**
 * Build the flat Splitwise create_expense payload.
 * Returns null if the split data is invalid.
 */
export const buildSplitPayload = ({
  totalAmount,
  description,
  currencyCode,
  payerUserId,
  participantUserIds,
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

  const participants = resolveParticipants(payerUserId, participantUserIds);

  if (participants.length < 2) return null;

  switch (splitState.splitType) {
    case SplitType.EQUAL: {
      // Bug #2 fix: compute perPerson for non-payers and assign remainder to payer
      const perPerson = (totalAmount / participants.length).toFixed(2);
      const payerOwed = (totalAmount - (participants.length - 1) * parseFloat(perPerson)).toFixed(2);
      const usersPayload: Record<string, unknown> = {};
      participants.forEach((userId, index) => {
        const paid = index === 0 ? cost : '0.00';
        const owed = index === 0 ? payerOwed : perPerson;
        Object.assign(usersPayload, userFields(index, userId, paid, owed));
      });
      return { ...base, split_equally: true, ...usersPayload };
    }

    case SplitType.EXACT: {
      // Bug #1 fix: payer key is absent from exactAmounts — derive payer's share as remainder.
      // Loop over non-payers (slice(1)) only, then compute payer's owed share as complement.
      let sumOfOthers = 0;
      const othersOwedShares: string[] = [];

      for (const userId of participants.slice(1)) {
        const key = String(userId);
        const val = parseFloat(splitState.exactAmounts[key] ?? '');
        if (isNaN(val)) return null;
        sumOfOthers += val;
        othersOwedShares.push(val.toFixed(2));
      }

      const payerOwed = totalAmount - sumOfOthers;
      if (payerOwed < -0.01) return null; // payer's share would be negative
      if (Math.abs(sumOfOthers + payerOwed - totalAmount) > 0.01) return null;

      const owedShares = [payerOwed.toFixed(2), ...othersOwedShares];

      const usersPayload: Record<string, unknown> = {};
      participants.forEach((userId, index) => {
        const paid = index === 0 ? cost : '0.00';
        Object.assign(usersPayload, userFields(index, userId, paid, owedShares[index] ?? '0.00'));
      });
      return { ...base, ...usersPayload };
    }

    case SplitType.PERCENTAGE: {
      // Bug #1 fix: payer key is absent from percentages — derive payer's pct as complement.
      // Bug #2 fix: assign rounding remainder to payer rather than computing from pct.
      let sumPct = 0;
      let sumOfOthersOwed = 0;
      const othersOwedShares: string[] = [];

      for (const userId of participants.slice(1)) {
        const key = String(userId);
        const pct = parseFloat(splitState.percentages[key] ?? '');
        if (isNaN(pct)) return null;
        sumPct += pct;
        const owedFloat = (totalAmount * pct) / 100;
        sumOfOthersOwed += owedFloat;
        othersOwedShares.push(owedFloat.toFixed(2));
      }

      const payerPct = 100 - sumPct;
      if (payerPct < -0.01) return null; // non-payers exceed 100%
      if (Math.abs(sumPct + payerPct - 100) > 0.01) return null;

      // Payer absorbs the rounding remainder
      const payerOwed = (totalAmount - sumOfOthersOwed).toFixed(2);
      const owedShares = [payerOwed, ...othersOwedShares];

      const usersPayload: Record<string, unknown> = {};
      participants.forEach((userId, index) => {
        const paid = index === 0 ? cost : '0.00';
        Object.assign(usersPayload, userFields(index, userId, paid, owedShares[index] ?? '0.00'));
      });
      return { ...base, ...usersPayload };
    }

    case SplitType.SHARES: {
      // Bug #1 note: for SHARES the payer IS expected to have a UI input (they are a group member).
      // Retain the existing NaN guard — if payer's key is absent, return null explicitly.
      // Bug #2 fix: assign rounding remainder to payer rather than computing from raw share ratio.
      let totalShares = 0;
      const rawShares: number[] = [];

      for (const userId of participants) {
        const key = String(userId);
        const s = parseFloat(splitState.shares[key] ?? '');
        if (isNaN(s) || s <= 0) return null; // explicit NaN check covers absent payer key
        totalShares += s;
        rawShares.push(s);
      }

      // Compute non-payer owed shares first; payer absorbs the rounding remainder.
      let sumOfOthersOwed = 0;
      const othersOwedShares: string[] = [];
      for (let i = 1; i < rawShares.length; i++) {
        const owedFloat = (totalAmount * (rawShares[i] ?? 0)) / totalShares;
        sumOfOthersOwed += owedFloat;
        othersOwedShares.push(owedFloat.toFixed(2));
      }
      const payerOwed = (totalAmount - sumOfOthersOwed).toFixed(2);
      const owedShares = [payerOwed, ...othersOwedShares];

      const usersPayload: Record<string, unknown> = {};
      participants.forEach((userId, index) => {
        const paid = index === 0 ? cost : '0.00';
        Object.assign(usersPayload, userFields(index, userId, paid, owedShares[index] ?? '0.00'));
      });
      return { ...base, ...usersPayload };
    }

    default:
      return null;
  }
};
