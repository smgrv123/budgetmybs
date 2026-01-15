import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { BCard, BIcon, BText, BView } from '../ui';

export type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
  iconBackgroundColor?: string;
};

const BFeatureCard: FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  iconColor = Colors.light.primary,
  iconBackgroundColor = Colors.light.muted,
}) => {
  return (
    <BCard style={{ marginBottom: Spacing.md, ...Shadows.sm }}>
      <BView row align="center" gap="md">
        <BView center bg={iconBackgroundColor} style={styles.iconContainer}>
          <BIcon name={icon as any} size="base" color={iconColor} />
        </BView>
        <BView flex gap="xs">
          <BText variant="label">{title}</BText>
          <BText variant="caption" muted>
            {description}
          </BText>
        </BView>
      </BView>
    </BCard>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: Spacing['4xl'],
    height: Spacing['4xl'],
    borderRadius: BorderRadius.base,
  },
});

export default BFeatureCard;
