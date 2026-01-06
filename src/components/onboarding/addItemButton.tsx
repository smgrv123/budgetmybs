import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { BButton, BIcon, BText } from '../ui';

export interface AddItemButtonProps {
  label: string;
  onPress: () => void;
}

const BAddItemButton: FC<AddItemButtonProps> = ({ label, onPress }) => {
  return (
    <BButton variant="ghost" onPress={onPress} style={styles.container}>
      <BIcon name="add" size="sm" color={Colors.light.textSecondary} />
      <BText variant="label" color={Colors.light.textSecondary} style={styles.label}>
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
    borderColor: Colors.light.borderDashed,
    backgroundColor: 'transparent',
  },
  label: {
    marginLeft: Spacing.sm,
  },
});

export default BAddItemButton;
