import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { SpacingValueType } from '@/constants/theme';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import BView from './view';

export type CardVariant = 'default' | 'form' | 'summary' | 'elevated';

export type BCardProps = {
  variant?: CardVariant;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: SpacingValueType;
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  form: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
  },
  summary: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
  },
  elevated: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.md,
  },
};

const BCard: FC<BCardProps> = ({ variant = 'default', gap, children, style }) => {
  return <BView style={[variantStyles[variant], gap && { gap: Spacing[gap] }, style]}>{children}</BView>;
};

export default BCard;
