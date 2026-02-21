import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BorderRadius, Spacing } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BButton, BIcon, BText } from '../ui';

export interface AddItemButtonProps {
  label: string;
  onPress: () => void;
}

const BAddItemButton: FC<AddItemButtonProps> = ({ label, onPress }) => {
  const themeColors = useThemeColors();

  return (
    <BButton variant="ghost" onPress={onPress} style={[styles.container, { borderColor: themeColors.borderDashed }]}>
      <BIcon name="add" size="sm" color={themeColors.textSecondary} />
      <BText variant="label" color={themeColors.textSecondary} style={styles.label}>
        {label || 'not'}
      </BText>
    </BButton>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  label: {
    marginLeft: Spacing.sm,
  },
});

export default BAddItemButton;
