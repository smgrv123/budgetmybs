/**
 * Types for the Splitwise outbound split feature (Phase 5 / Phase 13a).
 */

import { SplitType } from '@/src/constants/splitwise-outbound.strings';

// ============================================
// SPLIT TYPE
// ============================================

export type SplitTypeValue = (typeof SplitType)[keyof typeof SplitType];

// ============================================
// SPLIT FORM STATE
// ============================================

/**
 * Per-member input values (keyed by Splitwise user ID as string).
 * Used for exact, percentage, and shares split types.
 */
export type MemberInputMap = Record<string, string>;

export type SplitFormState = {
  splitType: SplitTypeValue;
  /**
   * Splitwise user IDs for direct-friend multi-select (not group members).
   * When `groupId` is null and `friendIds.length > 0`, these are the participants.
   * When `groupId` is set, `selectedMemberIds` drives the group members instead.
   */
  friendIds: string[];
  /** Splitwise group ID — null when splitting with a friend directly */
  groupId: string | null;
  /**
   * Selected member IDs (Splitwise user IDs as strings).
   * When empty and a group is selected, all group members are used.
   */
  selectedMemberIds: string[];
  /** Exact split: per-member amount (member user ID → amount string) */
  exactAmounts: MemberInputMap;
  /** Percentage split: per-member percentage (member user ID → pct string) */
  percentages: MemberInputMap;
  /** Shares split: per-member shares (member user ID → shares string) */
  shares: MemberInputMap;
};

export const INITIAL_SPLIT_STATE: SplitFormState = {
  splitType: SplitType.EQUAL,
  friendIds: [],
  groupId: null,
  selectedMemberIds: [],
  exactAmounts: {},
  percentages: {},
  shares: {},
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
