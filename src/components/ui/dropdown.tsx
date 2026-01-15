import type { DropdownOption } from '@/src/types';
import type { FC, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import type { ComponentSizeType } from '@/constants/theme';
import { BorderRadius, Colors, ComponentHeight, ComponentSize, FontSize, Opacity, Spacing } from '@/constants/theme';
import BButton from './button';
import BIcon from './icon';
import BInput from './input';
import BModal from './modal';
import BText from './text';
import BView from './view';

export type BDropdownProps = {
  options: DropdownOption[];
  value?: string | number | null;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  size?: ComponentSizeType;
  label?: string;
  error?: string;
  disabled?: boolean;
  modalTitle?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  searchable?: boolean;
  leftIcon?: string;
};

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
  searchable = false,
  leftIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchable, searchQuery]);

  const handleSelect = (option: DropdownOption) => {
    onValueChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const currentSize = sizeStyles[size];

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = item.value === value;

    return (
      <BButton
        variant="ghost"
        onPress={() => handleSelect(item)}
        style={[styles.option, isSelected && styles.optionSelected]}
      >
        <BText style={[styles.optionText, { fontSize: currentSize.fontSize }, isSelected && styles.optionTextSelected]}>
          {item.label}
        </BText>
        {isSelected && <BIcon name="checkmark" size="sm" color={Colors.light.primary} />}
      </BButton>
    );
  };

  const renderModalContent = (): ReactNode => (
    <BView style={styles.optionsList}>
      {searchable && (
        <BInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
          size={ComponentSize.SM}
          leftIcon={<BIcon name="search" size="sm" color={Colors.light.textMuted} />}
        />
      )}
      <FlatList
        data={filteredOptions}
        keyExtractor={(item) => String(item.value)}
        renderItem={renderOption}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        bounces={true}
        contentContainerStyle={styles.optionsContent}
        ListEmptyComponent={
          <BText center muted style={{ padding: Spacing.md }}>
            No options found
          </BText>
        }
      />
    </BView>
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
        <BView row align="center" gap="sm" flex>
          {leftIcon && <BIcon name={leftIcon as any} size="sm" color={Colors.light.textMuted} />}
          <BText
            style={{ fontSize: currentSize.fontSize }}
            color={selectedOption ? Colors.light.text : Colors.light.textMuted}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedOption?.label ?? placeholder}
          </BText>
        </BView>
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
        showCloseButton={true}
        closeOnBackdrop={true}
        swipeDirection={undefined}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        {renderModalContent()}
      </BModal>
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
    maxHeight: 400,
  },
  searchInput: {
    marginBottom: Spacing.sm,
  },
  optionsContent: {
    paddingBottom: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
