import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { CardVariantType, SpacingValueType } from '@/constants/theme';
import { BorderRadius, CardVariant, Shadows, Spacing, SpacingValue } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import BView from './view';

// Re-export for convenience
export type { CardVariantType as CardVariant } from '@/constants/theme';

export type BCardProps = {
  variant?: CardVariantType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: SpacingValueType;
};

const BCard: FC<BCardProps> = ({ variant = CardVariant.DEFAULT, gap, children, style }) => {
  const themeColors = useThemeColors();

  const variantStyles: Record<CardVariantType, ViewStyle> = {
    [CardVariant.DEFAULT]: {
      backgroundColor: themeColors.card,
      borderRadius: BorderRadius[SpacingValue.LG],
      padding: Spacing[SpacingValue.BASE],
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    [CardVariant.FORM]: {
      backgroundColor: themeColors.card,
      borderRadius: BorderRadius[SpacingValue.LG],
      padding: Spacing[SpacingValue.BASE],
      borderWidth: 1,
      borderColor: themeColors.border,
      gap: Spacing[SpacingValue.MD],
    },
    [CardVariant.SUMMARY]: {
      backgroundColor: themeColors.backgroundSecondary,
      borderRadius: BorderRadius[SpacingValue.BASE],
      padding: Spacing[SpacingValue.MD],
    },
    [CardVariant.ELEVATED]: {
      backgroundColor: themeColors.card,
      borderRadius: BorderRadius[SpacingValue.LG],
      padding: Spacing[SpacingValue.BASE],
      ...Shadows.md,
    },
  };

  return <BView style={[variantStyles[variant], gap && { gap: Spacing[gap] }, style]}>{children}</BView>;
};

export default BCard;
