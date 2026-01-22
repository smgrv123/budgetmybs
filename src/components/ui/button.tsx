import type { FC } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import type { BorderRadiusType, ButtonVariantType, ComponentSizeType, SpacingValueType } from '@/constants/theme';
import { BorderRadius, ButtonVariant, Colors, ComponentSize, Opacity, Spacing } from '@/constants/theme';

export interface BButtonProps extends PressableProps {
  variant?: ButtonVariantType;
  size?: ComponentSizeType;
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: BorderRadiusType;
  fullRounded?: boolean;
  padding?: SpacingValueType;
  paddingX?: SpacingValueType;
  paddingY?: SpacingValueType;
  margin?: SpacingValueType;
  marginX?: SpacingValueType;
  marginY?: SpacingValueType;
  gap?: SpacingValueType;
}

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
  rounded,
  fullRounded,
  padding,
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  gap,
  children,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(variant, pressed),
          borderColor: getBorderColor(variant),
          opacity: isDisabled ? Opacity.disabled : Opacity.full,
          borderRadius: fullRounded ? BorderRadius.full : rounded ? BorderRadius[rounded] : BorderRadius.base,
          ...(padding && { padding: Spacing[padding] }),
          ...(paddingX && { paddingHorizontal: Spacing[paddingX] }),
          ...(paddingY && { paddingVertical: Spacing[paddingY] }),
          ...(margin && { margin: Spacing[margin] }),
          ...(marginX && { marginHorizontal: Spacing[marginX] }),
          ...(marginY && { marginVertical: Spacing[marginY] }),
          ...(gap && { gap: Spacing[gap] }),
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
    paddingVertical: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    borderWidth: 1.5,
  },
});

export default BButton;
