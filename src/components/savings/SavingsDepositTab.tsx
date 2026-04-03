import type { FC } from 'react';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import type { SavingsType } from '@/db/types';
import { SavingsLabels } from '@/db/types';
import { createExpense } from '@/db';
import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  ADHOC_SAVINGS_BALANCES_QUERY_KEY,
  MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
  SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
  useSavingsGoals,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { savingsDepositSchema } from '@/src/validation/savings-deposit';
import { useQueryClient } from '@tanstack/react-query';

const AD_HOC_VALUE = '__adhoc__';

const savingsCategoryOptions = Object.entries(SavingsLabels).map(([value, label]) => ({ value, label }));

const { deposit: STRINGS } = SAVINGS_SCREEN_STRINGS;

interface SavingsDepositTabProps {
  onSuccess: (message: string) => void;
}

const SavingsDepositTab: FC<SavingsDepositTabProps> = ({ onSuccess }) => {
  const themeColors = useThemeColors();
  const queryClient = useQueryClient();
  const { savingsGoals } = useSavingsGoals();

  const [depositTo, setDepositTo] = useState<string>(AD_HOC_VALUE);
  const [adHocCategory, setAdHocCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; category?: string; destination?: string }>({});

  const depositToOptions = [
    ...savingsGoals.map((g) => ({ value: g.id, label: g.name })),
    { value: AD_HOC_VALUE, label: STRINGS.adHocOption },
  ];

  const isAdHoc = depositTo === AD_HOC_VALUE;

  const handleDepositToChange = (value: string | number) => {
    setDepositTo(String(value));
    if (String(value) !== AD_HOC_VALUE) {
      setAdHocCategory('');
      setErrors((prev) => ({ ...prev, destination: undefined, category: undefined }));
    } else {
      setErrors((prev) => ({ ...prev, destination: undefined }));
    }
  };

  const handleCategoryChange = (value: string | number) => {
    setAdHocCategory(String(value));
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const resetForm = () => {
    setDepositTo(AD_HOC_VALUE);
    setAdHocCategory('');
    setAmount('');
    setDescription('');
    setErrors({});
  };

  const handleSubmit = async () => {
    let resolvedGoalId: string | null = null;
    let resolvedType: string = '';

    if (isAdHoc) {
      resolvedGoalId = null;
      resolvedType = adHocCategory;
    } else {
      const selectedGoal = savingsGoals.find((g) => g.id === depositTo);
      resolvedGoalId = depositTo;
      resolvedType = selectedGoal?.type ?? '';
    }

    if (!isAdHoc && !depositTo) {
      setErrors({ destination: STRINGS.validation.destinationRequired });
      return;
    }

    const result = savingsDepositSchema.safeParse({
      amount: Number(amount),
      savingsType: resolvedType,
      savingsGoalId: resolvedGoalId,
      description: description.trim() || undefined,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        amount: fieldErrors.amount?.[0],
        category: isAdHoc ? fieldErrors.savingsType?.[0] : undefined,
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await createExpense({
        amount: result.data.amount,
        isSaving: 1,
        isWithdrawal: 0,
        savingsType: result.data.savingsType as SavingsType,
        savingsGoalId: result.data.savingsGoalId ?? null,
        description: result.data.description ?? null,
        excludeFromSpending: 1,
      });

      queryClient.invalidateQueries({ queryKey: SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADHOC_SAVINGS_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY });

      const formattedAmount = result.data.amount.toLocaleString('en-IN');
      resetForm();
      onSuccess(`₹${formattedAmount} ${STRINGS.successToastSuffix}`);
    } catch (error) {
      console.error(STRINGS.createFailedLog, error);
      Alert.alert('Error', STRINGS.createFailedAlert);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    Number(amount) > 0 && (isAdHoc ? adHocCategory.length > 0 : depositTo.length > 0 && depositTo !== AD_HOC_VALUE);

  const currencyPrefix = <BText muted>₹</BText>;

  return (
    <BView padding={SpacingValue.LG} gap="md" style={styles.container}>
      <BText variant={TextVariant.SUBHEADING}>{STRINGS.title}</BText>
      <BText variant={TextVariant.BODY} muted>
        {STRINGS.subtitle}
      </BText>

      <BDropdown
        label={STRINGS.depositToLabel}
        options={depositToOptions}
        value={depositTo}
        onValueChange={handleDepositToChange}
        placeholder={STRINGS.depositToPlaceholder}
        modalTitle={STRINGS.depositToModalTitle}
        error={errors.destination}
      />

      {isAdHoc && (
        <BDropdown
          label={STRINGS.categoryLabel}
          options={savingsCategoryOptions}
          value={adHocCategory || null}
          onValueChange={handleCategoryChange}
          placeholder={STRINGS.categoryPlaceholder}
          modalTitle={STRINGS.categoryModalTitle}
          searchable
          error={errors.category}
        />
      )}

      <BInput
        label={STRINGS.amountLabel}
        placeholder={STRINGS.amountPlaceholder}
        value={amount}
        onChangeText={(v) => {
          setAmount(v);
          setErrors((prev) => ({ ...prev, amount: undefined }));
        }}
        keyboardType="decimal-pad"
        leftIcon={currencyPrefix}
        error={errors.amount}
      />

      <BInput
        label={STRINGS.descriptionLabel}
        placeholder={STRINGS.descriptionPlaceholder}
        value={description}
        onChangeText={setDescription}
      />

      <BButton
        variant={ButtonVariant.PRIMARY}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit || isSubmitting}
        fullWidth
      >
        <BText variant={TextVariant.LABEL} color={themeColors.white}>
          {STRINGS.confirmButton}
        </BText>
      </BButton>
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
});

export default SavingsDepositTab;
