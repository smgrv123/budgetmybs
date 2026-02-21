import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import { isOtherType } from '@/src/constants/onboarding.config';
import { ButtonVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { CustomTypeModalConfig, FormField, ItemCardConfig, ListStepStrings } from '@/src/types';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { getFieldError, validateForm } from '@/src/validation/onboarding';
import { BButton, BCard, BDropdown, BInput, BModal, BText, BView } from '../ui';
import BAddItemButton from './addItemButton';
import BItemCard from './itemCard';
import BCustomTypeModal from './modals/customType';
import BSkipStepButton from './skipStepButton';

export type ListStepProps<T extends { tempId: string }> = {
  // Content
  strings: ListStepStrings;

  // Data
  items: T[];
  itemCardConfig: ItemCardConfig<T>;
  onRemoveItem: (tempId: string) => void;

  // Form
  formFields: FormField[];
  initialFormData: Record<string, string>;
  validationSchema: import('zod').ZodType;
  onAddItem: (data: any) => void;
  parseFormData: (formData: Record<string, string>) => any;

  // Navigation
  onNext: () => void;

  // Optional
  extraFormContent?: (formData: Record<string, string>) => ReactNode;
  customTypeModal?: CustomTypeModalConfig;
  nextButtonLabel?: string; // Custom label for settings reuse
  footerContent?: ReactNode; // Additional content above skip/continue button
};

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
  nextButtonLabel,
  footerContent,
}: ListStepProps<T>): React.JSX.Element {
  const themeColors = useThemeColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  // Auto-scroll to form when it opens
  useEffect(() => {
    if (showForm) {
      // Small delay to ensure form is rendered before scrolling
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showForm]);

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

  const CURRENCY_FIELDS = ['amount', 'principal', 'targetAmount'];

  const handleFieldChange = (key: string, value: string) => {
    let formattedValue = value;

    // Format currency fields with Indian number formatting
    if (CURRENCY_FIELDS.includes(key)) {
      // Parse first to strip existing commas, then reformat
      formattedValue = formatIndianNumber(parseFormattedNumber(value));
    }

    setFormData({ ...formData, [key]: formattedValue });
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
    <BView flex gap="xl">
      <BView>
        <BText variant="heading">{strings.heading}</BText>
        <BText variant="body" muted>
          {strings.subheading}
        </BText>
      </BView>

      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <BItemCard
            key={item.tempId}
            title={itemCardConfig.getTitle(item)}
            subtitle={itemCardConfig.getSubtitle?.(item)}
            amount={itemCardConfig.getAmount(item)}
            secondaryAmount={itemCardConfig.getSecondaryAmount?.(item)}
            secondaryLabel={itemCardConfig.secondaryLabel}
            onDelete={() => onRemoveItem(item.tempId)}
          />
        ))}

        {showForm ? (
          <BCard variant="form">
            <BView gap="md">
              {formFields.map((field) => (
                <Fragment key={field.key}>{renderFormField({ item: field })}</Fragment>
              ))}
            </BView>
            {extraFormContent?.(formData)}
            <BView row gap="md">
              <BButton
                onPress={handleAddItem}
                rounded="base"
                paddingY="sm"
                variant={ButtonVariant.PRIMARY}
                style={{ flex: 1, backgroundColor: themeColors.primary }}
              >
                <BText color="#FFFFFF" variant="label">
                  {strings.form.addButton}
                </BText>
              </BButton>
              <BButton
                variant={ButtonVariant.OUTLINE}
                onPress={handleCancel}
                rounded="base"
                paddingY="sm"
                style={{ flex: 1 }}
              >
                <BText variant="label">{strings.form.cancelButton}</BText>
              </BButton>
            </BView>
          </BCard>
        ) : (
          <BAddItemButton label={strings.addButton} onPress={() => setShowForm(true)} />
        )}
      </ScrollView>

      {footerContent}

      <BSkipStepButton
        showSkip={items.length > 0}
        strings={strings}
        onNext={onNext}
        nextButtonLabel={nextButtonLabel}
      />

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

export default ListStep;
