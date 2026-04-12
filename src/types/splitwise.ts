/**
 * Splitwise integration type definitions.
 */

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

export const SplitwiseConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECT_REQUIRED: 'reconnect_required',
} as const;

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
};
