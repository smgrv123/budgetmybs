/**
 * useSplitwise
 *
 * Manages Splitwise OAuth2 PKCE connection state.
 *
 * Features:
 *  - connect(): Opens OAuth browser, exchanges code, stores tokens, fetches currentUser
 *  - disconnect(): Clears tokens and resets state
 *  - isConnected, currentUser, status from TanStack Query
 *  - 401 on any API call → silent token refresh → if refresh fails: clearTokens + reconnectRequired flag
 */

import { useState, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  SPLITWISE_AUTH_URL,
  SPLITWISE_TOKEN_URL,
  SPLITWISE_ENDPOINTS,
  SPLITWISE_REDIRECT_URI,
} from '@/src/constants/splitwise.config';
import { SPLITWISE_STRINGS } from '@/src/constants/splitwise.strings';
import {
  clearTokens,
  exchangeCodeForTokens,
  isTokenExpired,
  loadTokens,
  silentRefresh,
} from '@/src/services/splitwise';
import { createHttpClient, AuthError } from '@/src/services/api';
import type { AuthProvider } from '@/src/services/api';
import { SplitwiseCurrentUserResponseSchema } from '@/src/validation/splitwise';
import type { SplitwiseConnectionStatusType, SplitwiseTokens, SplitwiseUser } from '@/src/types/splitwise';
import { SplitwiseConnectionStatus } from '@/src/types/splitwise';

// Enables expo-web-browser warm-up for smoother OAuth experience
WebBrowser.maybeCompleteAuthSession();

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_CONNECTION_QUERY_KEY = ['splitwise', 'connection'] as const;
export const SPLITWISE_CURRENT_USER_QUERY_KEY = ['splitwise', 'currentUser'] as const;

// ============================================
// HELPERS
// ============================================

const getClientId = (): string => process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_ID ?? '';
const getClientSecret = (): string => process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET ?? '';

/**
 * Build an AuthProvider that reads the stored access token and performs
 * a silent refresh on 401.
 */
const buildAuthProvider = (onRefreshFailed: () => void): AuthProvider => ({
  getAccessToken: async () => {
    const tokens = await loadTokens();
    if (!tokens) return null;

    if (isTokenExpired(tokens.expiresAt)) {
      try {
        const refreshed = await silentRefresh(getClientId(), getClientSecret());
        return refreshed.accessToken;
      } catch {
        onRefreshFailed();
        return null;
      }
    }

    return tokens.accessToken;
  },
  refreshToken: async () => {
    try {
      const refreshed = await silentRefresh(getClientId(), getClientSecret());
      return refreshed.accessToken;
    } catch {
      onRefreshFailed();
      throw new AuthError('Silent refresh failed.');
    }
  },
});

// ============================================
// CURRENT USER FETCH
// ============================================

const fetchCurrentUser = async (authProvider: AuthProvider): Promise<SplitwiseUser | null> => {
  const client = createHttpClient({
    baseUrl: '',
    authProvider,
  });

  const raw = await client.get<unknown>(SPLITWISE_ENDPOINTS.CURRENT_USER);
  const result = SplitwiseCurrentUserResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error('[useSplitwise] Invalid currentUser response:', result.error);
    return null;
  }
  return result.data.user;
};

// ============================================
// HOOK
// ============================================

export const useSplitwise = () => {
  const queryClient = useQueryClient();
  const [reconnectRequired, setReconnectRequired] = useState(false);

  const onRefreshFailed = useCallback(() => {
    setReconnectRequired(true);
  }, []);

  const authProvider = buildAuthProvider(onRefreshFailed);

  // ── Connection check query ────────────────────────────────────────────────
  // Determines if tokens exist in secure store (survives restarts).
  const tokensQuery = useQuery({
    queryKey: SPLITWISE_CONNECTION_QUERY_KEY,
    queryFn: loadTokens,
    // Stale time: re-check on each mount
    staleTime: 0,
  });

  const tokens: SplitwiseTokens | null = tokensQuery.data ?? null;
  const isConnected = Boolean(tokens?.accessToken);

  // ── Current user query ────────────────────────────────────────────────────
  const currentUserQuery = useQuery({
    queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY,
    queryFn: () => fetchCurrentUser(authProvider),
    enabled: isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const currentUser: SplitwiseUser | null = currentUserQuery.data ?? null;

  // ── Derived status ────────────────────────────────────────────────────────
  const status: SplitwiseConnectionStatusType = (() => {
    if (reconnectRequired) return SplitwiseConnectionStatus.RECONNECT_REQUIRED;
    if (isConnected) return SplitwiseConnectionStatus.CONNECTED;
    return SplitwiseConnectionStatus.DISCONNECTED;
  })();

  // ── OAuth discovery ───────────────────────────────────────────────────────
  const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: SPLITWISE_AUTH_URL,
    tokenEndpoint: SPLITWISE_TOKEN_URL,
  };

  const redirectUri = SPLITWISE_REDIRECT_URI;

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: [],
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  // ── Connect mutation ──────────────────────────────────────────────────────
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!request) {
        throw new Error(SPLITWISE_STRINGS.connectFailedBody);
      }

      const result = await promptAsync();

      if (result.type !== 'success') {
        throw new Error(SPLITWISE_STRINGS.authCancelledMessage);
      }

      const code = result.params.code;
      const codeVerifier = request.codeVerifier;

      if (!code || !codeVerifier) {
        throw new Error(SPLITWISE_STRINGS.connectFailedBody);
      }

      await exchangeCodeForTokens({
        code,
        codeVerifier,
        redirectUri,
        clientId: getClientId(),
        clientSecret: getClientSecret(),
      });
    },
    onSuccess: () => {
      setReconnectRequired(false);
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwise] connect failed:', error);
    },
  });

  // ── Disconnect mutation ───────────────────────────────────────────────────
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await clearTokens();
    },
    onSuccess: () => {
      setReconnectRequired(false);
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwise] disconnect failed:', error);
    },
  });

  // ── Connect async (for chat mutation map) ────────────────────────────────
  const connectAsync = connectMutation.mutateAsync;
  const disconnectAsync = disconnectMutation.mutateAsync;

  return {
    // Connection state
    isConnected,
    status,
    reconnectRequired,

    // Current user
    currentUser,
    isCurrentUserLoading: currentUserQuery.isLoading,
    isCurrentUserError: currentUserQuery.isError,

    // Tokens
    tokens,
    isTokensLoading: tokensQuery.isLoading,

    // Connect
    connect: connectMutation.mutate,
    connectAsync,
    isConnecting: connectMutation.isPending,
    connectError: connectMutation.error,

    // Disconnect
    disconnect: disconnectMutation.mutate,
    disconnectAsync,
    isDisconnecting: disconnectMutation.isPending,
    disconnectError: disconnectMutation.error,
  };
};
