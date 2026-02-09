import type { ComponentSizeType, InputVariantType, SpacingValueType, TextVariantType } from '@/constants/theme';
import {
  BorderRadius,
  ComponentHeight,
  ComponentSize,
  FontSize,
  InputVariant,
  Opacity,
  Spacing,
  TextVariant,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import BText from './text';
import BView from './view';

export interface BInputProps extends TextInputProps {
  /** Visual variant */
  variant?: InputVariantType;
  /** Input size */
  size?: ComponentSizeType;
  /** Label text above input */
  label?: string;
  /** Label variant */
  labelVariant?: TextVariantType;
  /** Error message */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Left icon component */
  leftIcon?: ReactNode;
  /** Right icon component */
  rightIcon?: ReactNode;
  /** Override container styles */
  containerStyle?: StyleProp<ViewStyle>;
  /** Border radius */
  rounded?: SpacingValueType;
}

const sizeStyles: Record<ComponentSizeType, { height: number; fontSize: number; paddingHorizontal: number }> = {
  [ComponentSize.SM]: { height: ComponentHeight.sm, fontSize: FontSize.sm, paddingHorizontal: Spacing.sm },
  [ComponentSize.MD]: { height: ComponentHeight.md, fontSize: FontSize.base, paddingHorizontal: Spacing.md },
  [ComponentSize.LG]: { height: ComponentHeight.lg, fontSize: FontSize.md, paddingHorizontal: Spacing.base },
};

const BInput: FC<BInputProps> = ({
  variant = InputVariant.DEFAULT,
  size = ComponentSize.MD,
  label,
  labelVariant = TextVariant.LABEL,
  error,
  helperText,
  leftIcon,
  rightIcon,
  editable = true,
  containerStyle,
  style,
  rounded,
  onFocus,
  onBlur,
  ...props
}) => {
  const themeColors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBackgroundColor = (): string => {
    if (!editable) return themeColors.backgroundSecondary;
    if (variant === InputVariant.FILLED) return themeColors.backgroundSecondary;
    return themeColors.background;
  };

  const getBorderColor = (): string => {
    if (error) return themeColors.error;
    if (isFocused) return themeColors.borderFocused;
    if (variant === InputVariant.FILLED) return 'transparent';
    return themeColors.border;
  };

  const currentSize = sizeStyles[size];

  return (
    <BView style={[styles.container, containerStyle]}>
      {label && (
        <BText variant={labelVariant} style={styles.label}>
          {label}
        </BText>
      )}
      <BView
        row
        style={[
          styles.inputContainer,
          {
            height: currentSize.height,
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            paddingHorizontal: currentSize.paddingHorizontal,
            opacity: editable ? Opacity.full : Opacity.disabled,
            borderRadius: rounded ? Spacing[rounded] : BorderRadius.base,
          },
        ]}
      >
        {leftIcon && <BView style={styles.leftIcon}>{leftIcon}</BView>}
        <TextInput
          editable={editable}
          placeholderTextColor={themeColors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
          style={[styles.input, { fontSize: currentSize.fontSize, color: themeColors.text }, style]}
        />
        {rightIcon && <BView style={styles.rightIcon}>{rightIcon}</BView>}
      </BView>
      {(error || helperText) && (
        <BText variant="caption" color={error ? themeColors.error : themeColors.textMuted} style={styles.helperText}>
          {error || helperText}
        </BText>
      )}
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
});

export default BInput;
