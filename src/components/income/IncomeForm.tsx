import type { FC } from 'react';
import { useState } from 'react';
import { Alert } from 'react-native';

import { USER_INCOME_TYPES } from '@/db/types';
import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { INCOME_FIELD_CONFIGS } from '@/src/constants/incomeForm.config';
import { INCOME_FORM_STRINGS } from '@/src/constants/income.strings';
import { ButtonVariant, Spacing, TextVariant } from '@/src/constants/theme';
import { useIncome } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { IncomeFieldKey, IncomeFieldType } from '@/src/types/income';
import { formatLocalDateToISO } from '@/src/utils/date';
import { incomeFormSchema } from '@/src/validation/income';
import { createIncomeFields } from './income-fields';

type IncomeFormProps = {
  onSuccess: () => void;
};

const IncomeForm: FC<IncomeFormProps> = ({ onSuccess }) => {
  const themeColors = useThemeColors();
  const { createIncomeAsync, isCreatingIncome } = useIncome();

  const [values, setValues] = useState({
    amount: '',
    type: '',
    customType: '',
    description: '',
    date: formatLocalDateToISO(new Date()),
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));

    if (key === IncomeFieldKey.TYPE && value !== values.type) {
      setValues((prev) => ({ ...prev, [key]: value, customType: '' }));
      setErrors((prev) => ({ ...prev, customType: undefined }));
    }
  };

  const handleSubmit = async () => {
    const result = incomeFormSchema.safeParse({
      amount: parseFloat(values.amount),
      type: values.type,
      customType: values.customType.trim() || undefined,
      description: values.description.trim() || undefined,
      date: values.date,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        [IncomeFieldKey.AMOUNT]: fieldErrors.amount?.[0],
        [IncomeFieldKey.TYPE]: fieldErrors.type?.[0],
        [IncomeFieldKey.CUSTOM_TYPE]: fieldErrors.customType?.[0],
      });
      return;
    }

    setErrors({});

    try {
      await createIncomeAsync({
        amount: result.data.amount,
        type: result.data.type as (typeof USER_INCOME_TYPES)[number],
        customType: result.data.customType ?? null,
        description: result.data.description ?? null,
        date: result.data.date,
      });

      setValues({
        amount: '',
        type: '',
        customType: '',
        description: '',
        date: formatLocalDateToISO(new Date()),
      });

      onSuccess();
    } catch (error) {
      console.error(INCOME_FORM_STRINGS.logs.createFailed, error);
      Alert.alert(INCOME_FORM_STRINGS.alerts.errorTitle, INCOME_FORM_STRINGS.alerts.createFailed);
    }
  };

  const fields = createIncomeFields({
    configs: INCOME_FIELD_CONFIGS,
    values,
    handleChange,
    errors,
  });

  const isOtherType = values.type === 'other';
  const canSubmit =
    parseFloat(values.amount) > 0 && values.type.length > 0 && (!isOtherType || values.customType.trim().length > 0);

  return (
    <BView gap="md" style={{ paddingBottom: Spacing.base }}>
      {fields.map((field) => {
        if (field.type === IncomeFieldType.DROPDOWN) {
          return (
            <BDropdown
              key={field.key}
              label={field.label}
              options={field.options ?? []}
              value={field.value || null}
              onValueChange={field.onValueChange}
              placeholder={field.placeholder}
              modalTitle={field.modalTitle}
              searchable={field.searchable}
              error={field.error}
            />
          );
        }

        return (
          <BInput
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={field.value}
            onChangeText={(v) => field.onValueChange(v)}
            keyboardType={field.keyboardType}
            leftIcon={field.leftIcon}
            error={field.error}
          />
        );
      })}

      <BButton
        variant={ButtonVariant.PRIMARY}
        onPress={handleSubmit}
        loading={isCreatingIncome}
        disabled={!canSubmit || isCreatingIncome}
        fullWidth
      >
        <BText variant={TextVariant.LABEL} color={themeColors.white}>
          {INCOME_FORM_STRINGS.submitButton}
        </BText>
      </BButton>
    </BView>
  );
};

export default IncomeForm;
