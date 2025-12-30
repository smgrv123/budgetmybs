import type { ButtonVariantType, ComponentSizeType } from '@/constants/theme';
import {
  BorderRadius,
  ButtonVariant,
  Colors,
  ComponentHeight,
  ComponentSize,
  FontSize,
  FontWeight,
  Opacity,
  Spacing,
} from '@/constants/theme';
import type { FC } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

export interface BButtonProps extends PressableProps {
  /** Visual variant */
  variant?: ButtonVariantType;
  /** Button size */
  size?: ComponentSizeType;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

const sizeStyles: Record<ComponentSizeType, { height: number; paddingHorizontal: number; fontSize: number }> = {
  [ComponentSize.SM]: { height: ComponentHeight.sm, paddingHorizontal: Spacing.md, fontSize: FontSize.sm },
  [ComponentSize.MD]: { height: ComponentHeight.md, paddingHorizontal: Spacing.base, fontSize: FontSize.base },
  [ComponentSize.LG]: { height: ComponentHeight.lg, paddingHorizontal: Spacing.xl, fontSize: FontSize.md },
};

const getBackgroundColor = (variant: ButtonVariantType, pressed: boolean): string => {
  if (variant === ButtonVariant.OUTLINE || variant === ButtonVariant.GHOST) {
    return pressed ? Colors.light.backgroundSecondary : 'transparent';
  }

  const colorMap: Record<ButtonVariantType, { default: string; pressed: string }> = {
    [ButtonVariant.PRIMARY]: { default: Colors.light.primary, pressed: Colors.light.primaryPressed },
    [ButtonVariant.SECONDARY]: { default: Colors.light.secondary, pressed: Colors.light.secondaryPressed },
    [ButtonVariant.DANGER]: { default: Colors.light.danger, pressed: Colors.light.dangerPressed },
    [ButtonVariant.OUTLINE]: { default: 'transparent', pressed: Colors.light.backgroundSecondary },
    [ButtonVariant.GHOST]: { default: 'transparent', pressed: Colors.light.backgroundSecondary },
  };

  return pressed ? colorMap[variant].pressed : colorMap[variant].default;
};

const getTextColor = (variant: ButtonVariantType): string => {
  if (variant === ButtonVariant.OUTLINE) return Colors.light.primary;
  if (variant === ButtonVariant.GHOST) return Colors.light.text;
  return '#FFFFFF';
};

const getBorderColor = (variant: ButtonVariantType): string => {
  if (variant === ButtonVariant.OUTLINE) return Colors.light.primary;
  return 'transparent';
};

const BButton: FC<BButtonProps> = ({
  variant = ButtonVariant.PRIMARY,
  size = ComponentSize.MD,
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const currentSize = sizeStyles[size];

  return (
    <Pressable
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(variant, pressed),
          borderColor: getBorderColor(variant),
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          opacity: isDisabled ? Opacity.disabled : Opacity.full,
        },
        fullWidth && styles.fullWidth,
        variant === ButtonVariant.OUTLINE && styles.outline,
        style as ViewStyle,
      ]}
    >
      {loading ? <ActivityIndicator color={getTextColor(variant)} size="small" /> : children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    borderWidth: 1.5,
  },
  text: {
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
});

export default BButton;
