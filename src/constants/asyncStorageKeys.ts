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
  // Number of times the impulse toggle has been activated (used for permission ask gating)
  IMPULSE_PERMISSION_ASK_COUNT: 'impulsePermissionAskCount',
  // ISO timestamp of the last successful Splitwise sync
  SPLITWISE_LAST_SYNCED_AT: 'splitwiseLastSyncedAt',
  // Set to 'true' when a silent token refresh fails — cleared on reconnect/disconnect
  SPLITWISE_RECONNECT_REQUIRED: 'splitwiseReconnectRequired',
} as const;

export type AsyncStorageKey = (typeof AsyncStorageKeys)[keyof typeof AsyncStorageKeys];
