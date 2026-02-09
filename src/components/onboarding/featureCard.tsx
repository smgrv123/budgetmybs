import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BCard, BIcon, BText, BView } from '../ui';

export type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
  iconBackgroundColor?: string;
};

const BFeatureCard: FC<FeatureCardProps> = ({ icon, title, description, iconColor, iconBackgroundColor }) => {
  const themeColors = useThemeColors();
  const resolvedIconColor = iconColor ?? themeColors.primary;
  const resolvedIconBgColor = iconBackgroundColor ?? themeColors.muted;

  return (
    <BCard style={{ marginBottom: Spacing.md, ...Shadows.sm }}>
      <BView row align="center" gap="md">
        <BView center bg={resolvedIconBgColor} style={styles.iconContainer}>
          <BIcon name={icon as any} size="base" color={resolvedIconColor} />
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
