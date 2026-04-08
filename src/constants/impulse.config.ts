import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';

// ─── Cooldown duration units ───────────────────────────────────────────────────

export const CooldownUnit = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
} as const;
export type CooldownUnitType = (typeof CooldownUnit)[keyof typeof CooldownUnit];

// ─── Preset cooldown durations ────────────────────────────────────────────────

export const CooldownPreset = {
  TEN_MIN: '10min',
  THIRTY_MIN: '30min',
  ONE_HOUR: '1hr',
  TWO_HOURS: '2hr',
  FIVE_HOURS: '5hr',
  ONE_DAY: '1day',
  CUSTOM: 'custom',
} as const;
export type CooldownPresetType = (typeof CooldownPreset)[keyof typeof CooldownPreset];

export type PresetDefinition = {
  preset: CooldownPresetType;
  label: string;
  minutes: number | null;
};

export const PRESET_DEFINITIONS: PresetDefinition[] = [
  { preset: CooldownPreset.TEN_MIN, label: IMPULSE_STRINGS.presets['10min'], minutes: 10 },
  { preset: CooldownPreset.THIRTY_MIN, label: IMPULSE_STRINGS.presets['30min'], minutes: 30 },
  { preset: CooldownPreset.ONE_HOUR, label: IMPULSE_STRINGS.presets['1hr'], minutes: 60 },
  { preset: CooldownPreset.TWO_HOURS, label: IMPULSE_STRINGS.presets['2hr'], minutes: 120 },
  { preset: CooldownPreset.FIVE_HOURS, label: IMPULSE_STRINGS.presets['5hr'], minutes: 300 },
  { preset: CooldownPreset.ONE_DAY, label: IMPULSE_STRINGS.presets['1day'], minutes: 1440 },
  { preset: CooldownPreset.CUSTOM, label: IMPULSE_STRINGS.presets.custom, minutes: null },
];

export const UNIT_OPTIONS: { label: string; value: CooldownUnitType }[] = [
  { label: IMPULSE_STRINGS.customUnitLabels.minutes, value: CooldownUnit.MINUTES },
  { label: IMPULSE_STRINGS.customUnitLabels.hours, value: CooldownUnit.HOURS },
  { label: IMPULSE_STRINGS.customUnitLabels.days, value: CooldownUnit.DAYS },
];

// ─── Permission ask thresholds ───────────────────────────────────────────────
// The impulse toggle activation counts at which we prompt for notification permission.
// After the 10th activation, we never ask again.

export const IMPULSE_PERMISSION_ASK_THRESHOLDS = [1, 3, 10];
export const IMPULSE_PERMISSION_MAX_ASK_COUNT = 10;

// ─── Notification category & action identifiers ───────────────────────────────

/** Category identifier for impulse-reminder notifications */
export const IMPULSE_NOTIFICATION_CATEGORY = 'impulse-reminder';

/** Action identifier for the Confirm button in impulse-reminder notifications */
export const IMPULSE_NOTIFICATION_ACTION_CONFIRM = 'impulse-confirm';

/** Action identifier for the Skip button in impulse-reminder notifications */
export const IMPULSE_NOTIFICATION_ACTION_SKIP = 'impulse-skip';

/** Prefix used on impulse notification identifiers so they can be selectively preserved */
export const IMPULSE_NOTIFICATION_ID_PREFIX = 'impulse-';

export const toMinutes = (value: number, unit: CooldownUnitType): number => {
  switch (unit) {
    case CooldownUnit.HOURS:
      return value * 60;
    case CooldownUnit.DAYS:
      return value * 1440;
    default:
      return value;
  }
};
