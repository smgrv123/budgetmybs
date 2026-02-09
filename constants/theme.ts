/**
 * Theme configuration with normalized values for consistent UI across devices
 */

import { normalize, normalizeFont } from '@/src/utils/normalize';
import { Platform } from 'react-native';

// ============================================
// SPACING VALUES (enum-like const)
// ============================================

export const SpacingValue = {
  NONE: 'none',
  XXS: 'xxs',
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  BASE: 'base',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
  '3XL': '3xl',
  '4XL': '4xl',
  '5XL': '5xl',
} as const;
export type SpacingValueType = (typeof SpacingValue)[keyof typeof SpacingValue];

// ============================================
// VARIANT ENUMS (for maintainability)
// ============================================

export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  DANGER: 'danger',
} as const;
export type ButtonVariantType = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const InputVariant = {
  DEFAULT: 'default',
  OUTLINE: 'outline',
  FILLED: 'filled',
} as const;
export type InputVariantType = (typeof InputVariant)[keyof typeof InputVariant];

export const TextVariant = {
  HEADING: 'heading',
  SUBHEADING: 'subheading',
  BODY: 'body',
  CAPTION: 'caption',
  LABEL: 'label',
} as const;
export type TextVariantType = (typeof TextVariant)[keyof typeof TextVariant];

export const LinkVariant = {
  DEFAULT: 'default',
  MUTED: 'muted',
} as const;
export type LinkVariantType = (typeof LinkVariant)[keyof typeof LinkVariant];

export const ComponentSize = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
} as const;
export type ComponentSizeType = (typeof ComponentSize)[keyof typeof ComponentSize];

export const CardVariant = {
  DEFAULT: 'default',
  FORM: 'form',
  SUMMARY: 'summary',
  ELEVATED: 'elevated',
} as const;
export type CardVariantType = (typeof CardVariant)[keyof typeof CardVariant];

export const IconFamily = {
  IONICONS: 'ionicons',
  MATERIAL: 'material',
  FEATHER: 'feather',
  FONTAWESOME: 'fontawesome',
} as const;
export type IconFamilyType = (typeof IconFamily)[keyof typeof IconFamily];

export const ModalPosition = {
  CENTER: 'center',
  BOTTOM: 'bottom',
} as const;
export type ModalPositionType = (typeof ModalPosition)[keyof typeof ModalPosition];

// ============================================
// COLORS
// ============================================

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#6B7280',
    textMuted: '#717182',
    background: '#FFFFFF',
    backgroundSecondary: '#F3F3F5',
    tint: '#4F6BED',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#4F6BED',
    border: 'rgba(0, 0, 0, 0.1)',
    borderFocused: '#4F6BED',
    borderDashed: 'rgba(0, 0, 0, 0.2)',
    error: '#D4183D',
    errorBackground: '#FEE2E2',
    success: '#16A34A',
    successBackground: '#DCFCE7',
    warning: '#D97706',
    warningBackground: '#FEF3C7',
    overlay: 'rgba(0, 0, 0, 0.5)',
    // Button variants
    primary: '#4F6BED',
    primaryFaded: 'rgba(79, 107, 237, 0.1)', // 10% opacity primary for backgrounds
    primaryPressed: '#3D56D4',
    secondary: '#bfc2c7ff',
    secondaryPressed: '#4B5563',
    danger: '#D4183D',
    dangerPressed: '#B91C1C',
    // Card colors
    card: '#FFFFFF',
    cardSecondary: '#F9FAFB',
    // Step indicator
    stepActive: '#4F6BED',
    stepCompleted: '#16A34A',
    stepInactive: '#E5E7EB',
    stepText: '#717182',
    // Input
    inputBackground: '#F3F3F5',
    // Muted
    muted: '#ECECF0',
    accent: '#E9EBEF',
    // Common colors
    white: '#FFFFFF',
    // Confirmation screen gradient
    confirmationGradientStart: '#6366F1',
    confirmationGradientMiddle: '#A855F7',
    confirmationGradientEnd: '#EC4899',
    // AI Recommendations
    recommendationBg: '#EEF2FF',
    // Success screen
    successGradientStart: '#D1FAE5',
    successGradientEnd: '#FFFFFF',
    successCheck: '#16A34A',
    successCheckBg: '#DCFCE7',
    // AI Plan - Priority badges
    priorityHigh: '#DC2626',
    priorityHighBg: '#FEE2E2',
    priorityMedium: '#D97706', // same as warning
    priorityMediumBg: '#FEF3C7', // same as warningBackground
    priorityLow: '#2563EB',
    priorityLowBg: '#DBEAFE',
    // AI Plan - Health score
    healthScoreGreen: '#16A34A', // same as success
    // AI Plan - Progress bar gradient
    progressGradientStart: '#6366F1',
    progressGradientEnd: '#4F6BED', // same as primary
    // AI Plan - Cards
    impactBg: '#DCFCE7', // same as successBackground
    summaryBg: '#F5F3FF',
    insightBg: '#F0F9FF',
    insightCheck: '#3B82F6',
  },
  dark: {
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    background: '#0F1115',
    backgroundSecondary: '#1A1D24',
    tint: '#7B93FF', // Slightly lighter primary for dark bg visibility
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#7B93FF',
    border: 'rgba(255, 255, 255, 0.08)',
    borderFocused: '#7B93FF',
    borderDashed: 'rgba(255, 255, 255, 0.15)',
    error: '#F87171', // Lighter red for dark bg
    errorBackground: 'rgba(239, 68, 68, 0.15)',
    success: '#4ADE80', // Lighter green for dark bg
    successBackground: 'rgba(34, 197, 94, 0.15)',
    warning: '#FBBF24', // Lighter amber for dark bg
    warningBackground: 'rgba(245, 158, 11, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.75)',
    // Button variants - same hue as light, lighter tint for dark bg
    primary: '#7B93FF', // Same hue as light primary (#4F6BED)
    primaryFaded: 'rgba(123, 147, 255, 0.12)',
    primaryPressed: '#5E78E6',
    secondary: '#374151',
    secondaryPressed: '#4B5563',
    danger: '#F87171',
    dangerPressed: '#FCA5A5',
    // Card colors - subtle elevation
    card: '#1A1D24',
    cardSecondary: '#22262F',
    // Step indicator
    stepActive: '#7B93FF',
    stepCompleted: '#4ADE80',
    stepInactive: '#374151',
    stepText: '#9CA3AF',
    // Input
    inputBackground: '#1A1D24',
    // Muted - subtle backgrounds
    muted: '#22262F',
    accent: '#2A2F3A',
    // Common colors
    white: '#FFFFFF',
    // Confirmation screen gradient - desaturated for dark mode
    confirmationGradientStart: '#5B5FC7', // Softer indigo
    confirmationGradientMiddle: '#8B5FBF', // Softer purple
    confirmationGradientEnd: '#C45F93', // Softer pink
    // AI Recommendations
    recommendationBg: 'rgba(123, 147, 255, 0.1)',
    // Success screen
    successGradientStart: 'rgba(34, 197, 94, 0.2)',
    successGradientEnd: '#0F1115',
    successCheck: '#4ADE80',
    successCheckBg: 'rgba(34, 197, 94, 0.15)',
    // AI Plan - Priority badges - maintain hue, use transparency for bg
    priorityHigh: '#F87171',
    priorityHighBg: 'rgba(239, 68, 68, 0.15)',
    priorityMedium: '#FBBF24',
    priorityMediumBg: 'rgba(245, 158, 11, 0.15)',
    priorityLow: '#60A5FA',
    priorityLowBg: 'rgba(59, 130, 246, 0.15)',
    // AI Plan - Health score
    healthScoreGreen: '#4ADE80',
    // AI Plan - Progress bar gradient
    progressGradientStart: '#5B5FC7',
    progressGradientEnd: '#7B93FF',
    // AI Plan - Cards - subtle transparent backgrounds
    impactBg: 'rgba(34, 197, 94, 0.12)',
    summaryBg: 'rgba(123, 147, 255, 0.12)',
    insightBg: 'rgba(59, 130, 246, 0.12)',
    insightCheck: '#60A5FA',
  },
};

// ============================================
// FONTS
// ============================================

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================
// TYPOGRAPHY (Normalized with pixel rounding)
// ============================================

export const FontSize = {
  xs: normalizeFont(10),
  sm: normalizeFont(12),
  base: normalizeFont(14),
  md: normalizeFont(16),
  lg: normalizeFont(18),
  xl: normalizeFont(20),
  '2xl': normalizeFont(24),
  '3xl': normalizeFont(30),
  '4xl': normalizeFont(36),
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

// ============================================
// SPACING (Normalized)
// ============================================

export const Spacing: Record<SpacingValueType, number> = {
  [SpacingValue.NONE]: 0,
  [SpacingValue.XXS]: normalize(2),
  [SpacingValue.XS]: normalize(4),
  [SpacingValue.SM]: normalize(8),
  [SpacingValue.MD]: normalize(12),
  [SpacingValue.BASE]: normalize(16),
  [SpacingValue.LG]: normalize(20),
  [SpacingValue.XL]: normalize(24),
  [SpacingValue['2XL']]: normalize(32),
  [SpacingValue['3XL']]: normalize(40),
  [SpacingValue['4XL']]: normalize(48),
  [SpacingValue['5XL']]: normalize(64),
};

// ============================================
// BORDER RADIUS (Normalized)
// ============================================

export const BorderRadius: Partial<Record<SpacingValueType, number>> & { full: number } = {
  [SpacingValue.NONE]: 0,
  [SpacingValue.XS]: normalize(2),
  [SpacingValue.SM]: normalize(4),
  [SpacingValue.MD]: normalize(6),
  [SpacingValue.BASE]: normalize(8),
  [SpacingValue.LG]: normalize(12),
  [SpacingValue.XL]: normalize(16),
  [SpacingValue['2XL']]: normalize(24),
  full: 9999,
};
export type BorderRadiusType = keyof typeof BorderRadius;

// ============================================
// ICON SIZES (Normalized)
// ============================================

export const IconSize = {
  xs: normalize(12),
  sm: normalize(16),
  md: normalize(20),
  base: normalize(24),
  lg: normalize(28),
  xl: normalize(32),
  '2xl': normalize(40),
  '3xl': normalize(48),
};

// ============================================
// OPACITY
// ============================================

export const Opacity = {
  disabled: 0.5,
  muted: 0.6,
  subtle: 0.8,
  full: 1,
  pressed: 0.7,
  overlay: 0.5,
  overlayDark: 0.7,
};

// ============================================
// SHADOWS
// ============================================

export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// ============================================
// COMPONENT SIZES (Normalized)
// ============================================

export const ComponentHeight = {
  sm: normalize(32),
  md: normalize(40),
  lg: normalize(48),
  xl: normalize(56),
};

// ============================================
// ANIMATION DURATIONS
// ============================================

export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 350,
};
