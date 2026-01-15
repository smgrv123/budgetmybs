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

const tintColorDark = '#fff';

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
    primaryPressed: '#3D56D4',
    secondary: '#6B7280',
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
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    background: '#151718',
    backgroundSecondary: '#1F2937',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#374151',
    borderFocused: tintColorDark,
    error: '#EF4444',
    errorBackground: '#7F1D1D',
    success: '#22C55E',
    successBackground: '#14532D',
    warning: '#F59E0B',
    warningBackground: '#78350F',
    overlay: 'rgba(0, 0, 0, 0.7)',
    // Button variants
    primary: '#0a7ea4',
    primaryPressed: '#0C8DB8',
    secondary: '#4B5563',
    secondaryPressed: '#6B7280',
    danger: '#EF4444',
    dangerPressed: '#F87171',
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

export const BorderRadius = {
  none: 0,
  xs: normalize(2),
  sm: normalize(4),
  md: normalize(6),
  base: normalize(8),
  lg: normalize(12),
  xl: normalize(16),
  '2xl': normalize(24),
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
