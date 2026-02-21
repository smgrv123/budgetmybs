import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { ButtonVariant, ComponentSize, Spacing } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import BButton, { type BButtonProps } from './button';
import BIcon from './icon';

export interface BFABProps extends Omit<BButtonProps, 'variant' | 'fullRounded' | 'children' | 'size'> {
  icon?: string;
  size?: number;
}

/**
 * Floating Action Button - Purple circular button with + icon
 * Positioned at bottom-right of screen
 */
const BFAB: FC<BFABProps> = ({ icon = 'add', size = 60, onPress, ...props }) => {
  const themeColors = useThemeColors();

  return (
    <BButton
      variant={ButtonVariant.PRIMARY}
      onPress={onPress}
      fullRounded
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          shadowColor: themeColors.primary,
        },
      ]}
      {...props}
    >
      <BIcon name={icon as any} size={ComponentSize.LG} color={themeColors.white} />
    </BButton>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8, // Android shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default BFAB;
