/**
 * User-facing strings for the Impulse Buy Cooldown feature
 */

export const IMPULSE_STRINGS = {
  // Toggle label
  toggleLabel: 'Impulse Buy?',
  toggleDescription: 'Mark this as an impulse purchase and set a cooldown reminder.',

  // Disclaimer shown when toggle is on (notifications granted)
  disclaimer:
    "This purchase will be held for your cooldown period. After the time is up, you'll receive a reminder to confirm or skip logging it.",

  // Disclaimer shown when toggle is on but notifications are denied
  disclaimerNotificationsDenied:
    'Notifications are off. This purchase will be logged immediately with the impulse flag — no cooldown period will apply.',

  // Override link
  overrideLink: 'Already purchased? Log it now',

  // Timer section
  timerSectionLabel: 'Cooldown Duration',

  // Preset chip labels
  presets: {
    '10min': '10 min',
    '30min': '30 min',
    '1hr': '1 hr',
    '2hr': '2 hr',
    '5hr': '5 hr',
    '1day': '1 day',
    custom: 'Custom',
  },

  // Custom picker labels
  customDurationLabel: 'Custom Duration',
  customAmountPlaceholder: '1',
  customUnitLabels: {
    minutes: 'Minutes',
    hours: 'Hours',
    days: 'Days',
  },

  // Notification permission denied alert
  permissionDeniedTitle: 'Notifications Disabled',
  permissionDeniedMessage:
    'To use the impulse cooldown reminder, please enable notifications for this app in your device settings.',
  permissionDeniedOpenSettings: 'Open Settings',
  permissionDeniedCancel: 'Not Now',

  // Errors
  cooldownRequired: 'Please select a cooldown duration',
  customValueInvalid: 'Please enter a valid duration greater than 0',

  // Notification content
  notificationTitle: 'Still want to buy this?',
  notificationBody: (description: string, amount: string) =>
    `You marked "${description}" (${amount}) as an impulse buy. Confirm or skip logging it.`,
  notificationBodyNoDescription: (amount: string) =>
    `You marked an impulse purchase of ${amount}. Confirm or skip logging it.`,
  notificationActionConfirm: 'Confirm',
  notificationActionSkip: 'Skip',

  // Save confirmations (console logging)
  savedPendingLog: 'Saved impulse purchase to pending store:',
  savedOverrideLog: 'Logged impulse purchase directly to DB:',
  savePendingFailedLog: 'Failed to save pending impulse purchase:',
  scheduleNotificationFailedLog: 'Failed to schedule impulse notification:',

  // Impulse Confirm Screen
  confirmScreenTitle: 'Impulse Review',
  confirmScreenEmptyTitle: 'Nothing to Review',
  confirmScreenEmptyBody: 'All impulse purchases have been handled.',
  confirmLabel: 'Confirm Purchase',
  skipLabel: 'Skip (Delete)',
  amountLabel: 'Amount',
  descriptionLabel: 'Description',
  categoryLabel: 'Category',
  dateLabel: 'Date',
  noDescription: 'No description',
  noCategory: 'Uncategorized',
  cooldownExpiredBadge: 'Cooldown expired',
  confirmErrorLog: 'Failed to confirm impulse purchase:',
  skipErrorLog: 'Failed to skip impulse purchase:',
  loadingLabel: 'Loading...',
} as const;
