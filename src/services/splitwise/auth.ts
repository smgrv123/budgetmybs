/**
 * Splitwise OAuth2 PKCE helpers and token storage.
 *
 * Token storage uses expo-secure-store.
 * Silent refresh uses the stored refresh token.
 * On refresh failure, tokens are cleared (caller must surface the reconnect prompt).
 */

import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';

import {
  SPLITWISE_TOKEN_KEYS,
  SPLITWISE_TOKEN_URL,
  SPLITWISE_TOKEN_REFRESH_BUFFER_MS,
} from '@/src/constants/splitwise.config';
import type { SplitwiseTokens } from '@/src/types/splitwise';
import { SplitwiseTokenResponseSchema } from '@/src/validation/splitwise';
import { AuthError } from '@/src/services/api';

// ============================================
// TOKEN STORAGE
// ============================================

export const storeTokens = async (tokens: SplitwiseTokens): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken ?? ''),
    SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.EXPIRES_AT, tokens.expiresAt ?? ''),
    SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.TOKEN_TYPE, tokens.tokenType),
  ]);
};

export const loadTokens = async (): Promise<SplitwiseTokens | null> => {
  const [accessToken, refreshToken, expiresAt, tokenType] = await Promise.all([
    SecureStore.getItemAsync(SPLITWISE_TOKEN_KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(SPLITWISE_TOKEN_KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(SPLITWISE_TOKEN_KEYS.EXPIRES_AT),
    SecureStore.getItemAsync(SPLITWISE_TOKEN_KEYS.TOKEN_TYPE),
  ]);

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: refreshToken || null,
    expiresAt: expiresAt || null,
    tokenType: tokenType ?? 'Bearer',
  };
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.EXPIRES_AT),
    SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.TOKEN_TYPE),
  ]);
};

// ============================================
// TOKEN EXPIRY CHECK
// ============================================

/**
 * Returns true if the stored access token is expired (or within the refresh buffer).
 */
export const isTokenExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false; // Unknown expiry — optimistically treat as valid
  const expiryMs = dayjs(expiresAt).valueOf();
  const nowMs = dayjs().valueOf();
  return nowMs >= expiryMs - SPLITWISE_TOKEN_REFRESH_BUFFER_MS;
};

// ============================================
// TOKEN EXCHANGE (auth code → tokens)
// ============================================

/**
 * Exchange an authorization code for tokens.
 * Returns the stored SplitwiseTokens on success.
 */
export const exchangeCodeForTokens = async (params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<SplitwiseTokens> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code_verifier: params.codeVerifier,
  });

  let response: Response;
  try {
    response = await fetch(SPLITWISE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    throw new AuthError('Network error during token exchange.');
  }

  if (!response.ok) {
    throw new AuthError(`Token exchange failed: ${response.status}`);
  }

  const rawBody: unknown = await response.json();
  const result = SplitwiseTokenResponseSchema.safeParse(rawBody);

  if (!result.success) {
    throw new AuthError('Invalid token response from Splitwise.');
  }

  const { access_token, refresh_token, expires_in, token_type } = result.data;

  const expiresAt = expires_in ? dayjs().add(expires_in, 'second').toISOString() : null;

  const tokens: SplitwiseTokens = {
    accessToken: access_token,
    refreshToken: refresh_token ?? null,
    expiresAt,
    tokenType: token_type,
  };

  await storeTokens(tokens);
  return tokens;
};

// ============================================
// SILENT REFRESH
// ============================================

/**
 * Attempts a silent token refresh using the stored refresh token.
 * Stores updated tokens on success.
 * Clears tokens and throws AuthError on failure — caller must surface reconnect prompt.
 */
export const silentRefresh = async (clientId: string, clientSecret: string): Promise<SplitwiseTokens> => {
  const current = await loadTokens();

  if (!current?.refreshToken) {
    await clearTokens();
    throw new AuthError('No refresh token available.');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: current.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let response: Response;
  try {
    response = await fetch(SPLITWISE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    console.error('[splitwise/auth] Network error during token refresh:', err);
    await clearTokens();
    throw new AuthError('Network error during token refresh.');
  }

  if (!response.ok) {
    await clearTokens();
    throw new AuthError(`Token refresh failed: ${response.status}`);
  }

  const rawBody: unknown = await response.json();
  const result = SplitwiseTokenResponseSchema.safeParse(rawBody);

  if (!result.success) {
    await clearTokens();
    throw new AuthError('Invalid refresh token response.');
  }

  const { access_token, refresh_token, expires_in, token_type } = result.data;

  const expiresAt = expires_in ? dayjs().add(expires_in, 'second').toISOString() : null;

  const updatedTokens: SplitwiseTokens = {
    accessToken: access_token,
    refreshToken: refresh_token ?? current.refreshToken,
    expiresAt,
    tokenType: token_type,
  };

  await storeTokens(updatedTokens);
  return updatedTokens;
};
