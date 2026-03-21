import * as SecureStore from 'expo-secure-store';

// Secure Store keys
const ACCESS_TOKEN_KEY = 'SPLITWISE_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'SPLITWISE_REFRESH_TOKEN';
const USER_ID_KEY = 'SPLITWISE_USER_ID';
const USER_NAME_KEY = 'SPLITWISE_USER_NAME';
const USER_AVATAR_KEY = 'SPLITWISE_USER_AVATAR';

// OAuth app credentials — set via .env
export const SPLITWISE_CLIENT_ID = process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_ID ?? '';
export const SPLITWISE_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPLITWISE_CLIENT_SECRET ?? '';

export const SPLITWISE_AUTH_URL = 'https://secure.splitwise.com/oauth/authorize';
export const SPLITWISE_TOKEN_URL = 'https://secure.splitwise.com/oauth/token';

// ─── Token accessors ────────────────────────────────────────────────────────

export const getSplitwiseAccessToken = async (): Promise<string | null> => {
  try {
    const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (stored) return stored;
    // Dev fallback: use bundled API key from env
    return process.env.EXPO_PUBLIC_SPLITWISE_API_KEY ?? null;
  } catch {
    return process.env.EXPO_PUBLIC_SPLITWISE_API_KEY ?? null;
  }
};

export const getSplitwiseRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setSplitwiseTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearSplitwiseTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const isSplitwiseConnected = async (): Promise<boolean> => {
  const token = await getSplitwiseAccessToken();
  return token !== null && token.length > 0;
};

// ─── User identity accessors ─────────────────────────────────────────────────

export type SplitwiseStoredUser = {
  id: string;
  name: string;
  avatar: string | null;
};

export const getSplitwiseUser = async (): Promise<SplitwiseStoredUser | null> => {
  try {
    const id = await SecureStore.getItemAsync(USER_ID_KEY);
    const name = await SecureStore.getItemAsync(USER_NAME_KEY);
    if (!id || !name) return null;
    const avatar = await SecureStore.getItemAsync(USER_AVATAR_KEY);
    return { id, name, avatar };
  } catch {
    return null;
  }
};

export const setSplitwiseUser = async (id: string, name: string, avatar: string | null): Promise<void> => {
  await SecureStore.setItemAsync(USER_ID_KEY, id);
  await SecureStore.setItemAsync(USER_NAME_KEY, name);
  if (avatar) {
    await SecureStore.setItemAsync(USER_AVATAR_KEY, avatar);
  } else {
    await SecureStore.deleteItemAsync(USER_AVATAR_KEY);
  }
};

export const clearSplitwiseUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(USER_NAME_KEY);
  await SecureStore.deleteItemAsync(USER_AVATAR_KEY);
};
