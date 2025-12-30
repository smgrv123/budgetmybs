import type { ComponentSizeType } from '@/constants/theme';
import {
  BorderRadius,
  ButtonVariant,
  Colors,
  ComponentHeight,
  ComponentSize,
  FontSize,
  Opacity,
  Spacing,
} from '@/constants/theme';
import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import BButton from './button';
import BIcon from './icon';
import BModal from './modal';
import BText from './text';
import BView from './view';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface BDropdownProps {
  /** Array of options */
  options: DropdownOption[];
  /** Currently selected value */
  value?: string | number | null;
  /** Called when selection changes */
  onValueChange: (value: string | number) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Dropdown size */
  size?: ComponentSizeType;
  /** Label above dropdown */
  label?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Modal title */
  modalTitle?: string;
  /** Override trigger button styles */
  style?: StyleProp<ViewStyle>;
  /** Override container styles */
  containerStyle?: StyleProp<ViewStyle>;
}

const sizeStyles: Record<ComponentSizeType, { height: number; fontSize: number; paddingHorizontal: number }> = {
  [ComponentSize.SM]: { height: ComponentHeight.sm, fontSize: FontSize.sm, paddingHorizontal: Spacing.sm },
  [ComponentSize.MD]: { height: ComponentHeight.md, fontSize: FontSize.base, paddingHorizontal: Spacing.md },
  [ComponentSize.LG]: { height: ComponentHeight.lg, fontSize: FontSize.md, paddingHorizontal: Spacing.base },
};

const BDropdown: FC<BDropdownProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  size = ComponentSize.MD,
  label,
  error,
  disabled = false,
  modalTitle = 'Select Option',
  style,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: DropdownOption) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  const currentSize = sizeStyles[size];

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = item.value === value;

    return (
      <BButton
        label={item.label}
        variant={ButtonVariant.GHOST}
        onPress={() => handleSelect(item)}
        style={[styles.option, isSelected && styles.optionSelected]}
        textStyle={[styles.optionText, { fontSize: currentSize.fontSize }, isSelected && styles.optionTextSelected]}
      />
    );
  };

  const renderModalContent = (): ReactNode => (
    <FlatList
      data={options}
      keyExtractor={(item) => String(item.value)}
      renderItem={renderOption}
      showsVerticalScrollIndicator={false}
      style={styles.optionsList}
    />
  );

  return (
    <BView style={[styles.container, containerStyle]}>
      {label && (
        <BText variant="label" style={styles.label}>
          {label}
        </BText>
      )}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            opacity: disabled ? Opacity.disabled : pressed ? Opacity.pressed : Opacity.full,
            borderColor: error ? Colors.light.error : Colors.light.border,
          },
          style,
        ]}
      >
        <BText
          style={{ fontSize: currentSize.fontSize }}
          color={selectedOption ? Colors.light.text : Colors.light.textMuted}
        >
          {selectedOption?.label ?? placeholder}
        </BText>
        <BIcon name="chevron-down" size="sm" color={Colors.light.textSecondary} />
      </Pressable>
      {error && (
        <BText variant="caption" color={Colors.light.error} style={styles.error}>
          {error}
        </BText>
      )}
      <BModal
        isVisible={isOpen}
        onClose={() => setIsOpen(false)}
        title={modalTitle}
        position="bottom"
        content={renderModalContent()}
      />
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.light.background,
  },
  error: {
    marginTop: Spacing.xs,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    justifyContent: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  optionSelected: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  optionText: {
    flex: 1,
    textAlign: 'left',
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

export default BDropdown;
