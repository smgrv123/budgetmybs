/**
 * Splitwise integration configuration constants.
 */

export const SPLITWISE_API_BASE_URL = 'https://secure.splitwise.com/api/v3.0';

export const SPLITWISE_AUTH_URL = 'https://secure.splitwise.com/oauth/authorize';
export const SPLITWISE_TOKEN_URL = 'https://secure.splitwise.com/oauth/token';

export const SPLITWISE_ENDPOINTS = {
  CURRENT_USER: `${SPLITWISE_API_BASE_URL}/get_current_user`,
  FRIENDS: `${SPLITWISE_API_BASE_URL}/get_friends`,
  GROUPS: `${SPLITWISE_API_BASE_URL}/get_groups`,
  CREATE_EXPENSE: `${SPLITWISE_API_BASE_URL}/create_expense`,
} as const;

export const SPLITWISE_REDIRECT_URI = 'budgetmybs://auth/splitwise';

export const SPLITWISE_TOKEN_KEYS = {
  ACCESS_TOKEN: 'splitwise_access_token',
  REFRESH_TOKEN: 'splitwise_refresh_token',
  EXPIRES_AT: 'splitwise_expires_at',
  TOKEN_TYPE: 'splitwise_token_type',
} as const;

/**
 * Number of milliseconds before token expiry at which we proactively refresh.
 * 5 minutes buffer.
 */
export const SPLITWISE_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Maximum number of retry attempts for a failed API call. */
export const HTTP_CLIENT_MAX_RETRIES = 2;

/** Delay in ms before retrying after a 429 rate limit response. */
export const HTTP_CLIENT_RATE_LIMIT_DELAY_MS = 1000;

/** Default request timeout in ms. */
export const HTTP_CLIENT_TIMEOUT_MS = 10_000;

/**
 * Splitwise sync endpoints
 */
export const SPLITWISE_SYNC_ENDPOINTS = {
  GET_EXPENSES: `${SPLITWISE_API_BASE_URL}/get_expenses`,
  GET_EXPENSE: `${SPLITWISE_API_BASE_URL}/get_expense`,
  UPDATE_EXPENSE: `${SPLITWISE_API_BASE_URL}/update_expense`,
  CURRENT_USER: `${SPLITWISE_API_BASE_URL}/get_current_user`,
} as const;

/**
 * How long (ms) before a cached sync is considered stale and triggers auto-sync on dashboard mount.
 * 5 minutes.
 */
export const SPLITWISE_STALE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Delay in ms between sequential Splitwise API calls to respect rate limits.
 */
export const SPLITWISE_API_CALL_DELAY_MS = 250;

/**
 * Maximum number of expenses to fetch per sync.
 */
export const SPLITWISE_SYNC_EXPENSE_LIMIT = 200;

/**
 * Secure store key for caching the local Splitwise user ID.
 */
export const SPLITWISE_USER_ID_KEY = 'splitwise_user_id';
