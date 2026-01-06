import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { BIcon, BText, BView } from '../ui';

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
  iconBackgroundColor?: string;
}

const BFeatureCard: FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  iconColor = Colors.light.primary,
  iconBackgroundColor = Colors.light.muted,
}) => {
  return (
    <BView row style={styles.container}>
      <BView center style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <BIcon name={icon as any} size="base" color={iconColor} />
      </BView>
      <BView flex>
        <BText variant="label" style={styles.title}>
          {title}
        </BText>
        <BText variant="caption" muted>
          {description}
        </BText>
      </BView>
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  iconContainer: {
    width: Spacing['4xl'],
    height: Spacing['4xl'],
    borderRadius: BorderRadius.base,
    marginRight: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
});

export default BFeatureCard;
