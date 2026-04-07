/**
 * User-facing strings for the Impulse Buy Cooldown feature
 */

export const IMPULSE_STRINGS = {
  // Toggle label
  toggleLabel: 'Impulse Buy?',
  toggleDescription: 'Mark this as an impulse purchase and set a cooldown reminder.',

  // Disclaimer shown when toggle is on
  disclaimer:
    "This purchase will be held for your cooldown period. After the time is up, you'll receive a reminder to confirm or skip logging it.",

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

  // Errors
  cooldownRequired: 'Please select a cooldown duration',
  customValueInvalid: 'Please enter a valid duration greater than 0',

  // Save confirmations (console logging)
  savedPendingLog: 'Saved impulse purchase to pending store:',
  savedOverrideLog: 'Logged impulse purchase directly to DB:',
  savePendingFailedLog: 'Failed to save pending impulse purchase:',
} as const;
