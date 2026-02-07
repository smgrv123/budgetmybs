/**
 * AsyncStorage key constants
 * Centralizes all storage keys for consistency and easy maintenance
 */

export const AsyncStorageKeys = {
  HEALTH_SCORE_WEIGHTS: 'healthScoreWeights',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  USER_PREFERENCES: 'userPreferences',
} as const;

export type AsyncStorageKey = (typeof AsyncStorageKeys)[keyof typeof AsyncStorageKeys];
