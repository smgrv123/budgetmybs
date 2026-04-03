import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { DropdownOption } from '@/src/types';
import type { ChatSavingsData } from '@/src/types/chat';
import { SAVINGS_TYPES, SavingsLabels, SavingsTypeEnum } from '@/db/types';
import type { SavingsGoal } from '@/db/schema-types';
import type { SavingsType } from '@/db/types';
import type { FC } from 'react';
import { useMemo, useState } from 'react';

const ADHOC_VALUE = '__adhoc__';

interface InlineSavingsFormProps {
  initialData: ChatSavingsData;
  onSubmit: (data: ChatSavingsData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  savingsGoals: SavingsGoal[];
}

const InlineSavingsForm: FC<InlineSavingsFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  savingsGoals,
}) => {
  const themeColors = useThemeColors();

  // Determine initial destination: matched goal id or __adhoc__
  const resolvedInitialDestination = initialData.savingsGoalId ?? ADHOC_VALUE;

  // Ensure initial savingsType is valid
  const resolvedInitialSavingsType = (SAVINGS_TYPES as readonly string[]).includes(initialData.savingsType)
    ? (initialData.savingsType as SavingsType)
    : SavingsTypeEnum.OTHER;

  const [amount, setAmount] = useState(String(initialData.amount));
  const [destination, setDestination] = useState<string>(resolvedInitialDestination);
  const [adHocSavingsType, setAdHocSavingsType] = useState<SavingsType>(
    initialData.savingsGoalId === null ? resolvedInitialSavingsType : SavingsTypeEnum.OTHER
  );
  const [description, setDescription] = useState(initialData.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const isAdHoc = destination === ADHOC_VALUE;

  // Build goal dropdown options: all active goals + ad-hoc option
  const destinationOptions = useMemo<DropdownOption[]>(() => {
    const goalOptions = savingsGoals.map((g) => ({ label: g.name, value: g.id }));
    return [...goalOptions, { label: CHAT_STRINGS.FORM_SAVINGS_ADHOC_OPTION, value: ADHOC_VALUE }];
  }, [savingsGoals]);

  const savingsTypeOptions = useMemo<DropdownOption[]>(
    () => SAVINGS_TYPES.map((t) => ({ label: SavingsLabels[t], value: t })),
    []
  );

  const handleDestinationChange = (v: string | number) => {
    setDestination(String(v));
  };

  const handleSavingsTypeChange = (v: string | number) => {
    const val = String(v);
    if ((SAVINGS_TYPES as readonly string[]).includes(val)) {
      setAdHocSavingsType(val as SavingsType);
    }
  };

  const handleSubmit = () => {
    const parsed = Number(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!destination) {
      setError('Please select a destination.');
      return;
    }
    if (isAdHoc && !adHocSavingsType) {
      setError('Please select a savings category.');
      return;
    }

    setError(null);

    if (isAdHoc) {
      onSubmit({
        amount: parsed,
        savingsGoalId: null,
        savingsType: adHocSavingsType,
        description: description.trim() || undefined,
      });
    } else {
      // Find the matched goal to get its type
      const matchedGoal = savingsGoals.find((g) => g.id === destination);
      onSubmit({
        amount: parsed,
        savingsGoalId: destination,
        savingsType: matchedGoal?.type ?? resolvedInitialSavingsType,
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_STRINGS.FORM_SAVINGS_TITLE}</BText>

      <BInput
        label={CHAT_STRINGS.FORM_SAVINGS_AMOUNT_LABEL}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
      />

      <BDropdown
        label={CHAT_STRINGS.FORM_SAVINGS_DEPOSIT_TO_LABEL}
        options={destinationOptions}
        value={destination}
        onValueChange={handleDestinationChange}
        modalTitle={CHAT_STRINGS.FORM_SAVINGS_DEPOSIT_TO_MODAL_TITLE}
      />

      {isAdHoc && (
        <BDropdown
          label={CHAT_STRINGS.FORM_SAVINGS_CATEGORY_LABEL}
          options={savingsTypeOptions}
          value={adHocSavingsType}
          onValueChange={handleSavingsTypeChange}
          modalTitle={CHAT_STRINGS.FORM_SAVINGS_CATEGORY_MODAL_TITLE}
        />
      )}

      <BInput
        label={CHAT_STRINGS.FORM_SAVINGS_DESCRIPTION_LABEL}
        value={description}
        onChangeText={setDescription}
        placeholder={CHAT_STRINGS.FORM_SAVINGS_DESCRIPTION_PLACEHOLDER}
      />

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
            {isSubmitting ? CHAT_STRINGS.FORM_SUBMITTING : CHAT_STRINGS.FORM_SAVINGS_SUBMIT}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

export default InlineSavingsForm;
