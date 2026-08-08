/**
 * SplitwiseAuthService — singleton that owns the full Splitwise auth lifecycle:
 *   - Token storage (load, store, clear) via expo-secure-store
 *   - Token expiry check
 *   - OAuth authorization code exchange
 *   - Silent refresh (implements AuthProvider for the generic HTTP client)
 *
 * On silent refresh failure:
 *   - Tokens are cleared from SecureStore
 *   - SPLITWISE_RECONNECT_REQUIRED flag written to AsyncStorage
 *   - useSplitwise reads that flag on mount and surfaces the reconnect banner
 *
 * Usage: import { splitwiseAuth } from '@/src/services/splitwise'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';

import {
  SPLITWISE_TOKEN_KEYS,
  SPLITWISE_TOKEN_URL,
  SPLITWISE_TOKEN_REFRESH_BUFFER_MS,
} from '@/src/constants/splitwise.config';
import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import type { SplitwiseTokens } from '@/src/types/splitwise';
import type { SplitwiseTokenResponse } from '@/src/validation/splitwise';
import { createHttpClient, AuthError } from '@/src/services/api';
import type { AuthProvider } from '@/src/services/api';

const tokenClient = createHttpClient({ baseUrl: '' });

class SplitwiseAuthService implements AuthProvider {
  // ── Token storage ───────────────────────────────────────────────────────────

  async storeTokens(tokens: SplitwiseTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken ?? ''),
      SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.EXPIRES_AT, tokens.expiresAt ?? ''),
      SecureStore.setItemAsync(SPLITWISE_TOKEN_KEYS.TOKEN_TYPE, tokens.tokenType),
    ]);
  }

  async loadTokens(): Promise<SplitwiseTokens | null> {
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
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.EXPIRES_AT),
      SecureStore.deleteItemAsync(SPLITWISE_TOKEN_KEYS.TOKEN_TYPE),
    ]);
  }

  // ── Reconnect flag ──────────────────────────────────────────────────────────

  async isReconnectRequired(): Promise<boolean> {
    const val = await AsyncStorage.getItem(AsyncStorageKeys.SPLITWISE_RECONNECT_REQUIRED);
    return val === 'true';
  }

  async clearReconnectRequired(): Promise<void> {
    await AsyncStorage.removeItem(AsyncStorageKeys.SPLITWISE_RECONNECT_REQUIRED);
  }

  private async flagReconnectRequired(): Promise<void> {
    await AsyncStorage.setItem(AsyncStorageKeys.SPLITWISE_RECONNECT_REQUIRED, 'true');
  }

  // ── Token expiry ────────────────────────────────────────────────────────────

  isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return dayjs().valueOf() >= dayjs(expiresAt).valueOf() - SPLITWISE_TOKEN_REFRESH_BUFFER_MS;
  }

  // ── OAuth code exchange ─────────────────────────────────────────────────────

  async exchangeCodeForTokens(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  }): Promise<SplitwiseTokens> {
    const formBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code_verifier: params.codeVerifier,
    }).toString();

    const { access_token, refresh_token, expires_in, token_type } = await tokenClient
      .post<SplitwiseTokenResponse>(SPLITWISE_TOKEN_URL, formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .catch(() => {
        throw new AuthError('Network error during token exchange.');
      });
    const expiresAt = expires_in ? dayjs().add(expires_in, 'second').toISOString() : null;

    const tokens: SplitwiseTokens = {
      accessToken: access_token,
      refreshToken: refresh_token ?? null,
      expiresAt,
      tokenType: token_type,
    };

    await this.storeTokens(tokens);
    return tokens;
  }

  // ── Silent refresh ──────────────────────────────────────────────────────────

  private async doSilentRefresh(clientId: string, clientSecret: string): Promise<SplitwiseTokens> {
    const current = await this.loadTokens();

    if (!current?.refreshToken) {
      await this.clearTokens();
      throw new AuthError('No refresh token available.');
    }

    const formBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    let tokenData: SplitwiseTokenResponse;
    try {
      tokenData = await tokenClient.post<SplitwiseTokenResponse>(SPLITWISE_TOKEN_URL, formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (err) {
      console.error('[splitwiseAuth] Token refresh failed:', err);
      await this.clearTokens();
      await this.flagReconnectRequired();
      throw new AuthError('Token refresh failed.');
    }

    const { access_token, refresh_token, expires_in, token_type } = tokenData;
    const expiresAt = expires_in ? dayjs().add(expires_in, 'second').toISOString() : null;

    const updatedTokens: SplitwiseTokens = {
      accessToken: access_token,
      refreshToken: refresh_token ?? current.refreshToken,
      expiresAt,
      tokenType: token_type,
    };

    await this.storeTokens(updatedTokens);
    return updatedTokens;
  }

  // ── AuthProvider implementation ─────────────────────────────────────────────

  private get clientId(): string {
    return process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET ?? '';
  }

  async getAccessToken(): Promise<string | null> {
    const tokens = await this.loadTokens();
    if (!tokens) return null;

    if (this.isTokenExpired(tokens.expiresAt)) {
      try {
        const refreshed = await this.doSilentRefresh(this.clientId, this.clientSecret);
        return refreshed.accessToken;
      } catch {
        return null;
      }
    }

    return tokens.accessToken;
  }

  async refreshToken(): Promise<string> {
    const refreshed = await this.doSilentRefresh(this.clientId, this.clientSecret);
    return refreshed.accessToken;
  }
}

export const splitwiseAuth = new SplitwiseAuthService();
