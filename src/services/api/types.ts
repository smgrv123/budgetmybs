/**
 * Typed errors and interfaces for the generic HTTP client.
 */

// ============================================
// AUTH PROVIDER INTERFACE
// ============================================

/**
 * Provides authentication tokens to the HTTP client.
 * The client calls getAccessToken() before each request and
 * refreshToken() when it receives a 401.
 */
export interface AuthProvider {
  /** Returns the current access token, or null if not authenticated. */
  getAccessToken: () => Promise<string | null>;
  /** Attempts a silent token refresh. Returns the new token on success. Throws on failure. */
  refreshToken: () => Promise<string>;
}

// ============================================
// TYPED ERRORS
// ============================================

/**
 * Thrown when the device has no network connectivity.
 */
export class NetworkError extends Error {
  constructor(message = 'No network connectivity.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when the server returns a 401 and the silent refresh also fails.
 */
export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message = 'Authentication failed.', statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Thrown when the server returns a 429 Too Many Requests.
 */
export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded. Please try again shortly.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown when the server returns a non-2xx response that is not a 401 or 429.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly responseBody: unknown;

  constructor(statusCode: number, message: string, responseBody?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
