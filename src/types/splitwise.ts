/**
 * Splitwise integration type definitions.
 */

import { SplitwiseConnectionStatus } from '@/src/constants/splitwise-outbound.strings';

export { SplitwiseConnectionStatus };

// ============================================
// USER
// ============================================

export type SplitwiseUser = {
  id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  picture?: {
    small?: string | null;
    medium?: string | null;
    large?: string | null;
  } | null;
};

// ============================================
// TOKENS
// ============================================

export type SplitwiseTokens = {
  accessToken: string;
  refreshToken: string | null;
  /** ISO string of when the access token expires, or null if unknown */
  expiresAt: string | null;
  tokenType: string;
};

// ============================================
// CONNECTION STATE
// ============================================

export type SplitwiseConnectionStatusType = (typeof SplitwiseConnectionStatus)[keyof typeof SplitwiseConnectionStatus];

export type SplitwiseConnectionState = {
  status: SplitwiseConnectionStatusType;
  currentUser: SplitwiseUser | null;
};

// ============================================
// SYNC RESULT
// ============================================

export type SplitwiseSyncResult = {
  synced: number;
  skipped: number;
  errors: number;
  settlements: number;
};

// ============================================
// FRIEND BALANCE CACHE
// ============================================

export type SplitwiseFriendBalanceEntry = {
  id: number;
  firstName: string;
  lastName: string;
  /** Positive = they owe you; negative = you owe them (INR only) */
  netAmount: number;
  /** Medium-size profile picture URL from Splitwise, if available */
  avatarUrl: string | null;
};

export type SplitwiseFriendBalanceCache = {
  /** ISO timestamp of when this cache was last populated */
  fetchedAt: string;
  friends: SplitwiseFriendBalanceEntry[];
};
