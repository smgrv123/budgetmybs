/**
 * useSplitwise
 *
 * Manages Splitwise OAuth2 PKCE connection state.
 *
 * Features:
 *  - connect(): Opens OAuth browser, exchanges code, stores tokens, fetches currentUser
 *  - disconnect(): Clears tokens and resets state
 *  - isConnected, currentUser, status from TanStack Query
 *  - reconnectRequired: derived from AsyncStorage flag set by splitwiseAuth on refresh failure
 */

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
import { splitwiseAuth } from '@/src/services/splitwise';
import { createHttpClient } from '@/src/services/api';
import type { SplitwiseCurrentUserApiResponse } from '@/src/validation/splitwise';
import type { SplitwiseConnectionStatusType, SplitwiseTokens, SplitwiseUser } from '@/src/types/splitwise';
import { SplitwiseConnectionStatus } from '@/src/types/splitwise';

// Enables expo-web-browser warm-up for smoother OAuth experience
WebBrowser.maybeCompleteAuthSession();

// ============================================
// QUERY KEYS
// ============================================

export const SPLITWISE_CONNECTION_QUERY_KEY = ['splitwise', 'connection'] as const;
export const SPLITWISE_CURRENT_USER_QUERY_KEY = ['splitwise', 'currentUser'] as const;
export const SPLITWISE_RECONNECT_REQUIRED_QUERY_KEY = ['splitwise', 'reconnectRequired'] as const;

// ============================================
// CURRENT USER FETCH
// ============================================

const fetchCurrentUser = async (): Promise<SplitwiseUser | null> => {
  const client = createHttpClient({ baseUrl: '', authProvider: splitwiseAuth });
  const { user } = await client.get<SplitwiseCurrentUserApiResponse>(SPLITWISE_ENDPOINTS.CURRENT_USER);
  return user;
};

// ============================================
// HOOK
// ============================================

const getClientId = (): string => process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_ID ?? '';

export const useSplitwise = () => {
  const queryClient = useQueryClient();

  // ── Connection check query ────────────────────────────────────────────────
  const tokensQuery = useQuery({
    queryKey: SPLITWISE_CONNECTION_QUERY_KEY,
    queryFn: () => splitwiseAuth.loadTokens(),
    staleTime: 0,
  });

  const tokens: SplitwiseTokens | null = tokensQuery.data ?? null;
  const isConnected = Boolean(tokens?.accessToken);

  // ── Reconnect required query ──────────────────────────────────────────────
  // splitwiseAuth writes this flag to AsyncStorage when a silent refresh fails.
  const reconnectQuery = useQuery({
    queryKey: SPLITWISE_RECONNECT_REQUIRED_QUERY_KEY,
    queryFn: () => splitwiseAuth.isReconnectRequired(),
    staleTime: 0,
  });

  const reconnectRequired = reconnectQuery.data ?? false;

  // ── Current user query ────────────────────────────────────────────────────
  const currentUserQuery = useQuery({
    queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isConnected,
    staleTime: 5 * 60 * 1000,
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
      if (!request) throw new Error(SPLITWISE_STRINGS.connectFailedBody);

      const result = await promptAsync();
      if (result.type !== 'success') throw new Error(SPLITWISE_STRINGS.authCancelledMessage);

      const code = result.params.code;
      const codeVerifier = request.codeVerifier;
      if (!code || !codeVerifier) throw new Error(SPLITWISE_STRINGS.connectFailedBody);

      await splitwiseAuth.exchangeCodeForTokens({
        code,
        codeVerifier,
        redirectUri,
        clientId: getClientId(),
        clientSecret: process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET ?? '',
      });

      await splitwiseAuth.clearReconnectRequired();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_RECONNECT_REQUIRED_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwise] connect failed:', error);
    },
  });

  // ── Disconnect mutation ───────────────────────────────────────────────────
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await splitwiseAuth.clearTokens();
      await splitwiseAuth.clearReconnectRequired();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CURRENT_USER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SPLITWISE_RECONNECT_REQUIRED_QUERY_KEY });
    },
    onError: (error) => {
      console.error('[useSplitwise] disconnect failed:', error);
    },
  });

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
    connectAsync: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    connectError: connectMutation.error,

    // Disconnect
    disconnect: disconnectMutation.mutate,
    disconnectAsync: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
    disconnectError: disconnectMutation.error,
  };
};
