import { normalize } from '@/src/utils/normalize';
import { SpacingValue, type SpacingValueType } from '@/src/constants/theme/variants';

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

export const ComponentHeight = {
  sm: normalize(32),
  md: normalize(40),
  lg: normalize(48),
  xl: normalize(56),
};
