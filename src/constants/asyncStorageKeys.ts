/**
 * AsyncStorage key constants
 * Centralizes all storage keys for consistency and easy maintenance
 */

export const AsyncStorageKeys = {
  HEALTH_SCORE_WEIGHTS: 'healthScoreWeights',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  USER_PREFERENCES: 'userPreferences',
  // Prefix for tracking last-used copy index per notification scenario
  // Full key: NOTIFICATION_LAST_COPY_PREFIX + NotificationScenarioType
  NOTIFICATION_LAST_COPY_PREFIX: 'notification_last_copy_',
  // Pending impulse purchases awaiting cooldown confirmation
  PENDING_IMPULSE_PURCHASES: 'pendingImpulsePurchases',
} as const;

export type AsyncStorageKey = (typeof AsyncStorageKeys)[keyof typeof AsyncStorageKeys];
