import type { LinkVariantType } from '@/constants/theme';
import { Colors, FontSize, LinkVariant, Opacity } from '@/constants/theme';
import type { Href } from 'expo-router';
import { Link as ExpoLink } from 'expo-router';
import type { FC, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import BButton from './button';
import BText from './text';

export interface BLinkProps {
  /** Link destination - can be a route path or external URL */
  href: Href;
  /** Link text content */
  children: ReactNode;
  /** Visual variant */
  variant?: LinkVariantType;
  /** Show underline */
  underline?: boolean;
  /** Font size */
  size?: 'sm' | 'base' | 'md' | 'lg';
  /** Override container styles */
  style?: StyleProp<ViewStyle>;
  /** Override text styles */
  textStyle?: StyleProp<TextStyle>;
  /** Called when pressed */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

const sizeMap: Record<string, number> = {
  sm: FontSize.sm,
  base: FontSize.base,
  md: FontSize.md,
  lg: FontSize.lg,
};

const BLink: FC<BLinkProps> = ({
  href,
  children,
  variant = LinkVariant.DEFAULT,
  underline = false,
  size = 'base',
  style,
  textStyle,
  onPress,
  disabled = false,
}) => {
  const getTextColor = (): string => {
    return variant === LinkVariant.MUTED ? Colors.light.textSecondary : Colors.light.primary;
  };

  return (
    <ExpoLink href={href} asChild>
      <BButton
        onPress={onPress}
        disabled={disabled}
        style={[styles.container, { opacity: disabled ? Opacity.disabled : Opacity.full }, style]}
      >
        <BText
          style={[
            {
              color: getTextColor(),
              fontSize: sizeMap[size],
              textDecorationLine: underline ? 'underline' : 'none',
            },
            textStyle,
          ]}
        >
          {children}
        </BText>
      </BButton>
    </ExpoLink>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default BLink;
