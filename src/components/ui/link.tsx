import { Opacity } from '@/constants/theme';
import type { Href } from 'expo-router';
import { Link as ExpoLink } from 'expo-router';
import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import BButton from './button';

export interface BLinkProps {
  /** Link destination - can be a route path or external URL */
  href: Href;
  /** Link text content */
  children: ReactNode;
  /** Override container styles */
  style?: StyleProp<ViewStyle>;
  /** Override text styles */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

const BLink: FC<BLinkProps> = ({ href, children, style, onPress, disabled = false }) => {
  return (
    <ExpoLink href={href} asChild style={styles.container}>
      <BButton
        onPress={onPress}
        disabled={disabled}
        style={[{ opacity: disabled ? Opacity.disabled : Opacity.full }, style]}
      >
        {children}
      </BButton>
    </ExpoLink>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

export default BLink;
