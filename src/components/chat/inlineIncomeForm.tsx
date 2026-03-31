import { BButton, BDateField, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { isISODateString } from '@/src/utils/date';
import type { DropdownOption } from '@/src/types';
import type { ChatIncomeData } from '@/src/types/chat';
import { IncomeLabels, IncomeTypeEnum, USER_INCOME_TYPES } from '@/db/types';
import type { IncomeType } from '@/db/types';
import type { FC } from 'react';
import { useMemo, useState } from 'react';

interface InlineIncomeFormProps {
  initialData: ChatIncomeData;
  onSubmit: (data: ChatIncomeData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InlineIncomeForm: FC<InlineIncomeFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const themeColors = useThemeColors();

  // Ensure the AI-returned type is one the user can actually select (excludes savings_withdrawal)
  const resolvedInitialType = (USER_INCOME_TYPES as readonly string[]).includes(initialData.type)
    ? initialData.type
    : USER_INCOME_TYPES[0]!;

  const [amount, setAmount] = useState(String(initialData.amount));
  const [type, setType] = useState<IncomeType>(resolvedInitialType);
  const [customType, setCustomType] = useState(initialData.customType ?? '');
  const [description, setDescription] = useState(initialData.description ?? '');
  const [date, setDate] = useState(initialData.date);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = useMemo<DropdownOption[]>(
    () => USER_INCOME_TYPES.map((t) => ({ label: IncomeLabels[t], value: t })),
    []
  );

  const isOther = type === IncomeTypeEnum.OTHER;

  const handleTypeChange = (v: string | number) => {
    const val = String(v);
    // BDropdown returns string | number; val is guaranteed to be a USER_INCOME_TYPES value
    // since all options are built from USER_INCOME_TYPES
    if ((USER_INCOME_TYPES as readonly string[]).includes(val)) {
      setType(val as IncomeType);
    }
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!type) {
      setError('Please select an income type.');
      return;
    }
    if (isOther && !customType.trim()) {
      setError('Please enter a custom type.');
      return;
    }
    if (!date || !isISODateString(date)) {
      setError('Please select a date.');
      return;
    }
    setError(null);
    onSubmit({
      amount: parsed,
      type,
      customType: isOther ? customType.trim() : undefined,
      description: description.trim() || undefined,
      date,
    });
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_STRINGS.FORM_INCOME_TITLE}</BText>

      <BInput
        label={CHAT_STRINGS.FORM_INCOME_AMOUNT_LABEL}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
      />

      <BDropdown
        label={CHAT_STRINGS.FORM_INCOME_TYPE_LABEL}
        options={typeOptions}
        value={type}
        onValueChange={handleTypeChange}
        modalTitle={CHAT_STRINGS.FORM_INCOME_TYPE_MODAL_TITLE}
      />

      {isOther && (
        <BInput
          label={CHAT_STRINGS.FORM_INCOME_CUSTOM_TYPE_LABEL}
          value={customType}
          onChangeText={setCustomType}
          placeholder={CHAT_STRINGS.FORM_INCOME_CUSTOM_TYPE_PLACEHOLDER}
        />
      )}

      <BInput
        label={CHAT_STRINGS.FORM_INCOME_DESCRIPTION_LABEL}
        value={description}
        onChangeText={setDescription}
        placeholder={CHAT_STRINGS.FORM_INCOME_DESCRIPTION_PLACEHOLDER}
      />

      <BDateField label={CHAT_STRINGS.FORM_INCOME_DATE_LABEL} value={date} onChange={setDate} />

      {error && (
        <BText variant={TextVariant.CAPTION} color={themeColors.danger}>
          {error}
        </BText>
      )}

      <BView row gap={SpacingValue.SM}>
        <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.text}>
            {CHAT_STRINGS.FORM_CANCEL}
          </BText>
        </BButton>
        <BButton variant={ButtonVariant.PRIMARY} onPress={handleSubmit} disabled={isSubmitting} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isSubmitting ? CHAT_STRINGS.FORM_SUBMITTING : CHAT_STRINGS.FORM_INCOME_SUBMIT}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

export default InlineIncomeForm;
