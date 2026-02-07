import * as SecureStore from 'expo-secure-store';

/**
 * Environment configuration for Gemini AI integration
 */

// Gemini model to use
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Secure Store key for user-provided API key (future)
const SECURE_STORE_API_KEY = 'GEMINI_API_KEY';

/**
 * Get Gemini API key with priority:
 * 1. User-provided key from SecureStore (future feature)
 * 2. Bundled key from environment variable
 *
 * @returns API key or null if not configured
 */
export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    // Future: Check SecureStore for user-provided key
    const userProvidedKey = await SecureStore.getItemAsync(SECURE_STORE_API_KEY);
    if (userProvidedKey) {
      return userProvidedKey;
    }

    // Fallback: Use bundled environment variable
    const bundledKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    return bundledKey ?? null;
  } catch (error) {
    console.error('Error retrieving Gemini API key:', error);
    return null;
  }
};

/**
 * Save user-provided API key to SecureStore (future feature)
 *
 * @param apiKey - The API key to save
 */
export const setGeminiApiKey = async (apiKey: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SECURE_STORE_API_KEY, apiKey);
  } catch (error) {
    console.error('Error saving Gemini API key:', error);
    throw error;
  }
};

/**
 * Clear user-provided API key from SecureStore (future feature)
 */
export const clearGeminiApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_API_KEY);
  } catch (error) {
    console.error('Error clearing Gemini API key:', error);
    throw error;
  }
};

/**
 * Check if Gemini is configured
 *
 * @returns true if API key is available
 */
export const isGeminiConfigured = async (): Promise<boolean> => {
  const apiKey = await getGeminiApiKey();
  return apiKey !== null && apiKey.length > 0;
};
