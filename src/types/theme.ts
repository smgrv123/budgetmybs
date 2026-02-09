/**
 * Theme type definitions
 */

// Theme preference enum - what the user selects
export const ThemePreference = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const;
export type ThemePreferenceType = (typeof ThemePreference)[keyof typeof ThemePreference];

// Color scheme enum - the resolved theme (light or dark)
export const ColorScheme = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;
export type ColorSchemeType = (typeof ColorScheme)[keyof typeof ColorScheme];
