import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { CardVariantType, SpacingValueType } from '@/constants/theme';
import { BorderRadius, CardVariant, Colors, Shadows, Spacing, SpacingValue } from '@/constants/theme';
import BView from './view';

// Re-export for convenience
export type { CardVariantType as CardVariant } from '@/constants/theme';

export type BCardProps = {
  variant?: CardVariantType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: SpacingValueType;
};

const variantStyles: Record<CardVariantType, ViewStyle> = {
  [CardVariant.DEFAULT]: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius[SpacingValue.LG],
    padding: Spacing[SpacingValue.BASE],
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  [CardVariant.FORM]: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius[SpacingValue.LG],
    padding: Spacing[SpacingValue.BASE],
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing[SpacingValue.MD],
  },
  [CardVariant.SUMMARY]: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius[SpacingValue.BASE],
    padding: Spacing[SpacingValue.MD],
  },
  [CardVariant.ELEVATED]: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius[SpacingValue.LG],
    padding: Spacing[SpacingValue.BASE],
    ...Shadows.md,
  },
};

const BCard: FC<BCardProps> = ({ variant = CardVariant.DEFAULT, gap, children, style }) => {
  return <BView style={[variantStyles[variant], gap && { gap: Spacing[gap] }, style]}>{children}</BView>;
};

export default BCard;
