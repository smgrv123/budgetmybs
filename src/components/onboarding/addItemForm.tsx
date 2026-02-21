import React, { Fragment, ReactNode } from 'react';

import { ButtonVariant, Spacing } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FormField } from '@/src/types';
import { getFieldError, validateForm } from '@/src/validation/onboarding';
import { BButton, BCard, BDropdown, BInput, BText, BView } from '../ui';

export type BItemFormProps = {
  formFields: FormField[];
  formData: Record<string, string>;
  formErrors: Record<string, string>;
  setFormErrors: (errors: Record<string, string>) => void;
  validationSchema: import('zod').ZodType;
  parseFormData: (formData: Record<string, string>) => any;
  onSubmitAction: (parsedData: any) => void;
  onCancelAction: () => void;
  onFieldChange: (key: string, value: string) => void;
  onDropdownChange: (key: string, value: string | number) => void;
  extraFormContent?: (formData: Record<string, string>) => ReactNode;
  submitLabel: string;
  cancelLabel: string;
};

const BItemForm = ({
  formFields,
  formData,
  formErrors,
  setFormErrors,
  validationSchema,
  parseFormData,
  onSubmitAction,
  onCancelAction,
  onFieldChange,
  onDropdownChange,
  extraFormContent,
  submitLabel,
  cancelLabel,
}: BItemFormProps) => {
  const themeColors = useThemeColors();

  const handleSubmit = () => {
    const parsedData = parseFormData(formData);
    const result = validateForm(validationSchema, parsedData);

    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }

    onSubmitAction(parsedData);
  };

  const renderFormField = (field: FormField) => {
    if (field.type === 'dropdown') {
      return (
        <BDropdown
          placeholder={field.placeholder}
          options={field.options || []}
          value={formData[field.key]}
          onValueChange={(value) => onDropdownChange(field.key, value)}
        />
      );
    }

    return (
      <BInput
        label={field.label}
        placeholder={field.placeholder}
        value={formData[field.key]}
        onChangeText={(text) => onFieldChange(field.key, text)}
        keyboardType={field.keyboardType}
        error={getFieldError(formErrors, field.key)}
        leftIcon={field.leftIcon}
        helperText={field.helperText}
      />
    );
  };

  return (
    <BCard variant="form" style={{ marginBottom: Spacing.md }}>
      <BView gap="md">
        {formFields.map((field) => (
          <Fragment key={field.key}>{renderFormField(field)}</Fragment>
        ))}
      </BView>
      {extraFormContent?.(formData)}
      <BView row gap="md">
        <BButton
          onPress={handleSubmit}
          rounded="base"
          paddingY="sm"
          variant={ButtonVariant.PRIMARY}
          style={{ flex: 1, backgroundColor: themeColors.primary }}
        >
          <BText color="#FFFFFF" variant="label">
            {submitLabel}
          </BText>
        </BButton>
        <BButton
          variant={ButtonVariant.OUTLINE}
          onPress={onCancelAction}
          rounded="base"
          paddingY="sm"
          style={{ flex: 1 }}
        >
          <BText variant="label">{cancelLabel}</BText>
        </BButton>
      </BView>
    </BCard>
  );
};

export default BItemForm;
