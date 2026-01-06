import type { ComponentSizeType, InputVariantType, TextVariantType } from '@/constants/theme';
import {
  BorderRadius,
  Colors,
  ComponentHeight,
  ComponentSize,
  FontSize,
  InputVariant,
  Opacity,
  Spacing,
  TextVariant,
} from '@/constants/theme';
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
  onFocus,
  onBlur,
  ...props
}) => {
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
    if (!editable) return Colors.light.backgroundSecondary;
    if (variant === InputVariant.FILLED) return Colors.light.backgroundSecondary;
    return Colors.light.background;
  };

  const getBorderColor = (): string => {
    if (error) return Colors.light.error;
    if (isFocused) return Colors.light.borderFocused;
    if (variant === InputVariant.FILLED) return 'transparent';
    return Colors.light.border;
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
          },
        ]}
      >
        {leftIcon && <BView style={styles.leftIcon}>{leftIcon}</BView>}
        <TextInput
          editable={editable}
          placeholderTextColor={Colors.light.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
          style={[styles.input, { fontSize: currentSize.fontSize }, style]}
        />
        {rightIcon && <BView style={styles.rightIcon}>{rightIcon}</BView>}
      </BView>
      {(error || helperText) && (
        <BText variant="caption" color={error ? Colors.light.error : Colors.light.textMuted} style={styles.helperText}>
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
    borderRadius: BorderRadius.base,
  },
  input: {
    flex: 1,
    color: Colors.light.text,
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
