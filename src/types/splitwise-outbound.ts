/**
 * Types for the Splitwise outbound split feature (Phase 5).
 */

import { SplitType } from '@/src/constants/splitwise-outbound.strings';

// ============================================
// SPLIT TYPE
// ============================================

export type SplitTypeValue = (typeof SplitType)[keyof typeof SplitType];

// ============================================
// SPLIT FORM STATE
// ============================================

export type SplitFormState = {
  splitType: SplitTypeValue;
  /** Splitwise user ID of the friend (or group member) to split with */
  friendId: string | null;
  /** Splitwise group ID — null when splitting with a friend directly */
  groupId: string | null;
  /** Exact split: payer's amount */
  yourExactAmount: string;
  /** Exact split: friend's amount */
  friendExactAmount: string;
  /** Percentage split: payer's percentage */
  yourPercentage: string;
  /** Percentage split: friend's percentage */
  friendPercentage: string;
  /** Shares split: payer's shares */
  yourShares: string;
  /** Shares split: friend's shares */
  friendShares: string;
};

// ============================================
// SPLIT PUSH PAYLOAD
// ============================================

/**
 * Flat payload for POST /api/v3.0/create_expense.
 * Keys follow the Splitwise API format (users__N__field).
 */
export type SplitwiseCreateExpensePayload = {
  cost: string;
  description: string;
  currency_code: string;
  split_equally?: boolean;
  group_id?: number;
  [key: string]: unknown;
};
