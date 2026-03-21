import {
  clearSplitwiseTokens,
  clearSplitwiseUser,
  getSplitwiseUser,
  isSplitwiseConnected,
  setSplitwiseTokens,
  setSplitwiseUser,
  SPLITWISE_AUTH_URL,
  SPLITWISE_CLIENT_ID,
} from '@/src/config/splitwise';
import {
  exchangeCodeForTokens,
  fetchSplitwiseCurrentUser,
  initializeSplitwiseClient,
  SplitwiseUser,
} from '@/src/services/splitwise';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const SPLITWISE_CONNECTION_QUERY_KEY = ['splitwise', 'connection'] as const;

type SplitwiseConnection = {
  isConnected: boolean;
  user: SplitwiseUser | null;
};

const fetchConnectionState = async (): Promise<SplitwiseConnection> => {
  const connected = await isSplitwiseConnected();
  if (!connected) return { isConnected: false, user: null };

  // Try to fetch current user to verify token is still valid
  const client = await initializeSplitwiseClient();
  if (!client) return { isConnected: false, user: null };

  try {
    const user = await fetchSplitwiseCurrentUser(client);
    await setSplitwiseUser(user.id, user.name, user.avatar);
    return { isConnected: true, user };
  } catch {
    // Token may be expired — return cached user info from SecureStore
    const cached = await getSplitwiseUser();
    if (cached) return { isConnected: true, user: cached };
    return { isConnected: false, user: null };
  }
};

export const useSplitwise = () => {
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: SPLITWISE_CONNECTION_QUERY_KEY,
    queryFn: fetchConnectionState,
    staleTime: 5 * 60 * 1000, // 5 minutes — don't re-verify on every render
  });

  const redirectUri = makeRedirectUri({ scheme: 'budgetmybs', path: 'auth/splitwise' });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!SPLITWISE_CLIENT_ID) {
        throw new Error('Splitwise client ID is not configured.');
      }

      const authUrl =
        `${SPLITWISE_AUTH_URL}?` +
        new URLSearchParams({
          client_id: SPLITWISE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: 'code',
        }).toString();

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        // User cancelled — not an error
        return null;
      }

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No authorization code received from Splitwise.');

      const tokens = await exchangeCodeForTokens(code, redirectUri);
      await setSplitwiseTokens(tokens.access_token, tokens.refresh_token);

      const client = await initializeSplitwiseClient();
      if (!client) throw new Error('Failed to initialize Splitwise client after auth.');

      const user = await fetchSplitwiseCurrentUser(client);
      await setSplitwiseUser(user.id, user.name, user.avatar);

      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
    },
    onError: (error: Error) => {
      Alert.alert('Connection Failed', error.message ?? 'Please try again.');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await clearSplitwiseTokens();
      await clearSplitwiseUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPLITWISE_CONNECTION_QUERY_KEY });
    },
  });

  return {
    isConnected: connectionQuery.data?.isConnected ?? false,
    user: connectionQuery.data?.user ?? null,
    isLoading: connectionQuery.isLoading,

    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,

    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
};
