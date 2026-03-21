import { Client, OAuth2User } from 'splitwise-ts';
import {
  SPLITWISE_CLIENT_ID,
  SPLITWISE_CLIENT_SECRET,
  SPLITWISE_TOKEN_URL,
  clearSplitwiseTokens,
  getSplitwiseAccessToken,
  getSplitwiseRefreshToken,
  setSplitwiseTokens,
} from '@/src/config/splitwise';

// ─── Token adapter ────────────────────────────────────────────────────────────
// Bridges our Secure Store token to the AuthClient interface expected by Client.
// rest() in splitwise-ts only reads `.accessToken` — it never calls
// `requestAccessToken()`, so that method is a no-op here.

// Extends the publicly-exported OAuth2User (which itself extends AuthClient).
// We only override accessToken — rest() in splitwise-ts never calls requestAccessToken().
class SplitwiseTokenAdapter extends OAuth2User {
  #token: string;

  constructor(token: string) {
    // OAuth2User requires credentials but we won't use its auth flow
    super({ clientId: '', clientSecret: '' });
    this.#token = token;
  }

  override get accessToken(): string {
    return this.#token;
  }

  override async requestAccessToken(): Promise<{ access_token: string }> {
    return { access_token: this.#token };
  }
}

// ─── Client initialization ───────────────────────────────────────────────────

export const initializeSplitwiseClient = async (): Promise<Client | null> => {
  const token = await getSplitwiseAccessToken();
  if (!token) return null;
  return new Client(new SplitwiseTokenAdapter(token));
};

// ─── Token exchange ───────────────────────────────────────────────────────────

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

export const exchangeCodeForTokens = async (code: string, redirectUri: string): Promise<TokenResponse> => {
  const response = await fetch(SPLITWISE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SPLITWISE_CLIENT_ID,
      client_secret: SPLITWISE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<TokenResponse>;
};

export const refreshSplitwiseToken = async (): Promise<string | null> => {
  const refreshToken = await getSplitwiseRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(SPLITWISE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: SPLITWISE_CLIENT_ID,
        client_secret: SPLITWISE_CLIENT_SECRET,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as TokenResponse;
    await setSplitwiseTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
};

// ─── User info ────────────────────────────────────────────────────────────────

export type SplitwiseUser = {
  id: string;
  name: string;
  avatar: string | null;
};

export const fetchSplitwiseCurrentUser = async (client: Client): Promise<SplitwiseUser> => {
  const response = await client.users.getCurrentUser();
  const user = response?.user;
  if (!user) throw new Error('No user data returned from Splitwise');

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Splitwise User';
  const avatar = user.picture?.medium ?? null;

  return { id: String(user.id), name, avatar };
};

// ─── Silent re-auth ───────────────────────────────────────────────────────────
// Attempts to refresh the token when a 401 is encountered.
// Returns a new Client on success, null on failure (caller should disconnect).

export const withSilentReauth = async <T>(fn: (client: Client) => Promise<T>): Promise<T | null> => {
  const client = await initializeSplitwiseClient();
  if (!client) return null;

  try {
    return await fn(client);
  } catch (error: unknown) {
    const isUnauthorized = error instanceof Error && (error.message.includes('401') || error.message.includes('402'));

    if (!isUnauthorized) throw error;

    // Attempt silent refresh
    const newToken = await refreshSplitwiseToken();
    if (!newToken) {
      await clearSplitwiseTokens();
      return null;
    }

    const refreshedClient = new Client(new SplitwiseTokenAdapter(newToken));
    return await fn(refreshedClient);
  }
};
