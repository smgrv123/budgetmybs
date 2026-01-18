import type { TextVariantType } from '@/constants/theme';
import { Colors, FontSize, FontWeight, LineHeight, TextVariant } from '@/constants/theme';
import type { FC } from 'react';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as RNText, StyleSheet } from 'react-native';

export interface BTextProps extends RNTextProps {
  /** Typography variant */
  variant?: TextVariantType;
  /** Text color - can use theme colors or custom */
  color?: string;
  /** Center align text */
  center?: boolean;
  /** Muted text (lower opacity) */
  muted?: boolean;
}

const variantStyles: Record<
  TextVariantType,
  { fontSize: number; fontWeight: TextStyle['fontWeight']; lineHeight: number }
> = {
  [TextVariant.HEADING]: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  [TextVariant.SUBHEADING]: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.tight,
  },
  [TextVariant.BODY]: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  [TextVariant.CAPTION]: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  [TextVariant.LABEL]: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.md * LineHeight.tight,
  },
};

const BText: FC<BTextProps> = ({
  variant = TextVariant.BODY,
  color,
  center = false,
  muted = false,
  style,
  children,
  ...props
}) => {
  const currentVariant = variantStyles[variant];
  const textColor = color ?? (muted ? Colors.light.textMuted : Colors.light.text);

  return (
    <RNText
      {...props}
      style={[
        styles.base,
        {
          fontSize: currentVariant.fontSize,
          fontWeight: currentVariant.fontWeight,
          lineHeight: currentVariant.lineHeight,
          color: textColor,
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {},
});

export default BText;
