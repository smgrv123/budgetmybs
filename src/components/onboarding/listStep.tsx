import { ReactNode, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { ZodSchema } from 'zod';

import { isOtherType } from '@/constants/onboarding.config';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { getFieldError, validateForm } from '@/src/validation/onboarding';
import { BButton, BDropdown, BInput, BModal, BText, BView } from '../ui';
import BAddItemButton from './addItemButton';
import BItemCard from './itemCard';
import BCustomTypeModal from './modals/customType';
import BSkipStepButton from './skipStepButton';

export interface FormField {
  key: string;
  type: 'input' | 'dropdown';
  label?: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  options?: { value: string; label: string }[];
  leftIcon?: ReactNode;
  helperText?: string;
}

export interface ItemCardConfig<T> {
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getAmount: (item: T) => number;
  getSecondaryAmount?: (item: T) => number;
  secondaryLabel?: string;
}

export interface ListStepStrings {
  heading: string;
  subheading: string;
  addButton: string;
  continueButton: string;
  skipButton: string;
  form: {
    addButton: string;
    cancelButton: string;
  };
}

export interface CustomTypeModalConfig {
  title: string;
  placeholder: string;
  addButton: string;
  cancelButton: string;
}

export interface ListStepProps<T extends { tempId: string }> {
  // Content
  strings: ListStepStrings;

  // Data
  items: T[];
  itemCardConfig: ItemCardConfig<T>;
  onRemoveItem: (tempId: string) => void;

  // Form
  formFields: FormField[];
  initialFormData: Record<string, string>;
  validationSchema: ZodSchema;
  onAddItem: (data: any) => void;
  parseFormData: (formData: Record<string, string>) => any;

  // Navigation
  onNext: () => void;

  // Optional
  extraFormContent?: (formData: Record<string, string>) => ReactNode;
  customTypeModal?: CustomTypeModalConfig;
}

function ListStep<T extends { tempId: string }>({
  strings,
  items,
  itemCardConfig,
  onRemoveItem,
  formFields,
  initialFormData,
  validationSchema,
  onAddItem,
  parseFormData,
  onNext,
  extraFormContent,
  customTypeModal,
}: ListStepProps<T>): React.JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  const handleAddItem = () => {
    const parsedData = parseFormData(formData);
    const result = validateForm(validationSchema, parsedData);

    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }

    onAddItem(parsedData);
    setFormData(initialFormData);
    setFormErrors({});
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
    if (formErrors[key]) {
      setFormErrors({ ...formErrors, [key]: '' });
    }
  };

  const handleDropdownSelect = (key: string, value: string | number) => {
    const stringValue = String(value);
    if (isOtherType(stringValue) && customTypeModal) {
      // Delay opening custom modal to allow dropdown modal to close first.
      setTimeout(() => setShowCustomTypeModal(true), 500);
    } else {
      handleFieldChange(key, stringValue);
    }
  };

  const handleAddCustomType = () => {
    if (customTypeName.trim()) {
      handleFieldChange('type', 'other');
      setCustomTypeName('');
      setShowCustomTypeModal(false);
    }
  };

  const renderFormField = ({ item }: { item: FormField }) => {
    if (item.type === 'dropdown') {
      return (
        <BDropdown
          placeholder={item.placeholder}
          options={item.options || []}
          value={formData[item.key]}
          onValueChange={(value) => handleDropdownSelect(item.key, value)}
        />
      );
    }
    return (
      <BInput
        label={item.label}
        placeholder={item.placeholder}
        value={formData[item.key]}
        onChangeText={(text) => handleFieldChange(item.key, text)}
        keyboardType={item.keyboardType}
        error={getFieldError(formErrors, item.key)}
        leftIcon={item.leftIcon}
        helperText={item.helperText}
      />
    );
  };

  return (
    <BView style={styles.stepContainer}>
      <BView style={styles.stepHeader}>
        <BText variant="heading">{strings.heading}</BText>
        <BText variant="body" muted>
          {strings.subheading}
        </BText>
      </BView>

      <BView style={styles.listContainer}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.tempId}
          renderItem={({ item }) => (
            <BItemCard
              title={itemCardConfig.getTitle(item)}
              subtitle={itemCardConfig.getSubtitle?.(item)}
              amount={itemCardConfig.getAmount(item)}
              secondaryAmount={itemCardConfig.getSecondaryAmount?.(item)}
              secondaryLabel={itemCardConfig.secondaryLabel}
              onDelete={() => onRemoveItem(item.tempId)}
            />
          )}
          scrollEnabled={false}
          ListFooterComponent={
            showForm ? (
              <BView style={styles.formCard}>
                <FlatList
                  data={formFields}
                  keyExtractor={(item) => item.key}
                  renderItem={renderFormField}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <BView style={styles.fieldSeparator} />}
                />
                {extraFormContent?.(formData)}
                <BView row gap="md" style={styles.formButtons}>
                  <BButton
                    onPress={handleAddItem}
                    style={[styles.customButton, { backgroundColor: Colors.light.primary }]}
                  >
                    <BText color="#FFFFFF" variant="label">
                      {strings.form.addButton}
                    </BText>
                  </BButton>
                  <BButton
                    variant="ghost"
                    onPress={handleCancel}
                    style={[styles.customButton, { backgroundColor: Colors.light.muted }]}
                  >
                    <BText variant="label">{strings.form.cancelButton}</BText>
                  </BButton>
                </BView>
              </BView>
            ) : (
              <BAddItemButton label={strings.addButton} onPress={() => setShowForm(true)} />
            )
          }
        />
      </BView>

      <BSkipStepButton showSkip={items.length > 0} strings={strings} onNext={onNext} />

      {/* Custom Type Modal */}
      {customTypeModal && (
        <BModal
          isVisible={showCustomTypeModal}
          onClose={() => setShowCustomTypeModal(false)}
          title={customTypeModal.title}
        >
          <BCustomTypeModal
            customTypeModal={customTypeModal}
            customTypeName={customTypeName}
            setCustomTypeName={setCustomTypeName}
            handleAddCustomType={handleAddCustomType}
            setShowCustomTypeModal={setShowCustomTypeModal}
          />
        </BModal>
      )}
    </BView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: Spacing.xl,
  },
  listContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.md,
  },
  fieldSeparator: {
    height: Spacing.md,
  },
  formButtons: {
    marginTop: Spacing.sm,
  },
  customButton: {
    flex: 1,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
  },
});

export default ListStep;
