import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { CustomTypeModalConfig } from '@/src/types';
import { Dispatch, SetStateAction } from 'react';
import { BButton, BInput, BText, BView } from '../../ui';

type CustomTypeModalProps = {
  customTypeModal: CustomTypeModalConfig;
  customTypeName: string;
  setCustomTypeName: (name: string) => void;
  handleAddCustomType: () => void;
  setShowCustomTypeModal: Dispatch<SetStateAction<boolean>>;
};

export default function BCustomTypeModal({
  customTypeModal,
  customTypeName,
  setCustomTypeName,
  handleAddCustomType,
  setShowCustomTypeModal,
}: CustomTypeModalProps) {
  return (
    <BView gap="md">
      <BInput placeholder={customTypeModal.placeholder} value={customTypeName} onChangeText={setCustomTypeName} />
      <BView row gap="md">
        <BButton onPress={handleAddCustomType} style={[styles.customButton, { backgroundColor: Colors.light.primary }]}>
          <BText color="#FFFFFF" variant="label">
            {customTypeModal.addButton}
          </BText>
        </BButton>
        <BButton
          variant="ghost"
          onPress={() => setShowCustomTypeModal(false)}
          style={[styles.customButton, { backgroundColor: Colors.light.muted }]}
        >
          <BText variant="label">{customTypeModal.cancelButton}</BText>
        </BButton>
      </BView>
    </BView>
  );
}

const styles = StyleSheet.create({
  customButton: {
    flex: 1,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
  },
});
