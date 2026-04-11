/**
 * Splitwise integration configuration constants.
 */

export const SPLITWISE_API_BASE_URL = 'https://secure.splitwise.com/api/v3.0';

export const SPLITWISE_AUTH_URL = 'https://secure.splitwise.com/oauth/authorize';
export const SPLITWISE_TOKEN_URL = 'https://secure.splitwise.com/oauth/token';

export const SPLITWISE_ENDPOINTS = {
  CURRENT_USER: `${SPLITWISE_API_BASE_URL}/get_current_user`,
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
