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
