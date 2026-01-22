import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { ButtonVariant, Colors, ComponentSize, Spacing } from '@/constants/theme';
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
        },
      ]}
      {...props}
    >
      <BIcon name={icon as any} size={ComponentSize.LG} color={Colors.light.white} />
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
    shadowColor: Colors.light.primary, // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default BFAB;
