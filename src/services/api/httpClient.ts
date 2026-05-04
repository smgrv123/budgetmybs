/**
 * Generic typed HTTP client.
 *
 * Features:
 *  - fetch-based, no third-party SDK
 *  - Typed responses via generics
 *  - Auth injection via AuthProvider interface
 *  - Automatic 401 → silent token refresh → retry (once)
 *  - Retry on network failure (up to HTTP_CLIENT_MAX_RETRIES attempts)
 *  - Rate limit delay on 429
 *  - Request timeout via AbortController
 *  - Typed errors: NetworkError, AuthError, RateLimitError, ApiError
 */

import {
  HTTP_CLIENT_MAX_RETRIES,
  HTTP_CLIENT_RATE_LIMIT_DELAY_MS,
  HTTP_CLIENT_TIMEOUT_MS,
} from '@/src/constants/splitwise.config';
import type { AuthProvider } from './types';
import { ApiError, AuthError, NetworkError, RateLimitError } from './types';

// ============================================
// HELPERS
// ============================================

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const parseResponseBody = async <T>(response: Response): Promise<T | string | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text;
  }
};

// ============================================
// HTTP CLIENT FACTORY
// ============================================

export type HttpClientOptions = {
  baseUrl: string;
  authProvider?: AuthProvider;
  /** Override timeout in ms. Defaults to HTTP_CLIENT_TIMEOUT_MS. */
  timeoutMs?: number;
};

export type RequestOptions = {
  headers?: Record<string, string>;
  /** When true, skip auth injection for this request. Useful for token refresh calls. */
  skipAuth?: boolean;
};

export type HttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

const executeRequest = async <T>(
  method: string,
  url: string,
  body: unknown | undefined,
  authProvider: AuthProvider | undefined,
  extraHeaders: Record<string, string>,
  timeoutMs: number,
  retryCount: number,
  isRefreshRetry: boolean
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (authProvider && !extraHeaders['Authorization']) {
    const token = await authProvider.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body as BodyInit | undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // AbortError from our own timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timed out.');
    }

    // Generic network failure — retry up to max
    if (retryCount < HTTP_CLIENT_MAX_RETRIES) {
      return executeRequest<T>(
        method,
        url,
        body,
        authProvider,
        extraHeaders,
        timeoutMs,
        retryCount + 1,
        isRefreshRetry
      );
    }

    throw new NetworkError('Network request failed after retries.');
  }

  clearTimeout(timeoutId);

  // ── 429 Rate limit ────────────────────────────────────────────────────────
  if (response.status === 429) {
    if (retryCount < HTTP_CLIENT_MAX_RETRIES) {
      await delay(HTTP_CLIENT_RATE_LIMIT_DELAY_MS);
      return executeRequest<T>(
        method,
        url,
        body,
        authProvider,
        extraHeaders,
        timeoutMs,
        retryCount + 1,
        isRefreshRetry
      );
    }
    throw new RateLimitError();
  }

  // ── 401 Unauthorized ─────────────────────────────────────────────────────
  if (response.status === 401) {
    // Only attempt one refresh cycle to prevent infinite loops
    if (!isRefreshRetry && authProvider) {
      let newToken: string;
      try {
        newToken = await authProvider.refreshToken();
      } catch {
        throw new AuthError('Token refresh failed.');
      }

      return executeRequest<T>(
        method,
        url,
        body,
        authProvider,
        { ...extraHeaders, Authorization: `Bearer ${newToken}` },
        timeoutMs,
        0,
        true
      );
    }
    throw new AuthError('Unauthorized.', 401);
  }

  // ── Other non-2xx ────────────────────────────────────────────────────────
  if (!response.ok) {
    const responseBody = await parseResponseBody(response);
    throw new ApiError(response.status, `API error: ${response.status} ${response.statusText}`, responseBody);
  }

  // ── Success ──────────────────────────────────────────────────────────────
  const data = await parseResponseBody(response);
  return data as T;
};

export const createHttpClient = (options: HttpClientOptions): HttpClient => {
  const { baseUrl, authProvider, timeoutMs = HTTP_CLIENT_TIMEOUT_MS } = options;

  const request = <T>(
    method: string,
    path: string,
    body: unknown | undefined,
    requestOptions?: RequestOptions
  ): Promise<T> => {
    const url = `${baseUrl}${path}`;
    const extraHeaders = requestOptions?.skipAuth
      ? { ...requestOptions.headers }
      : { ...(requestOptions?.headers ?? {}) };

    const effectiveAuthProvider = requestOptions?.skipAuth ? undefined : authProvider;

    return executeRequest<T>(method, url, body, effectiveAuthProvider, extraHeaders, timeoutMs, 0, false);
  };

  return {
    get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
    delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
  };
};
