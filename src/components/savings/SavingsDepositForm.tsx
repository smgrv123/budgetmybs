import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import type { SavingsType } from '@/db/types';
import { SavingsLabels } from '@/db/types';
import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { SAVINGS_DEPOSIT_STRINGS } from '@/src/constants/savings-deposit.strings';
import { ButtonVariant, Spacing, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { ADHOC_SAVINGS_BALANCES_QUERY_KEY, SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY, useSavingsGoals } from '@/src/hooks';
import { savingsDepositSchema } from '@/src/validation/savings-deposit';
import { useQueryClient } from '@tanstack/react-query';
import { createExpense } from '@/db';

const AD_HOC_GOAL_VALUE = '__adhoc__';

const savingsTypeOptions = Object.entries(SavingsLabels).map(([value, label]) => ({ value, label }));

type SavingsDepositFormProps = {
  onSuccess?: () => void;
};

const SavingsDepositForm: FC<SavingsDepositFormProps> = ({ onSuccess }) => {
  const themeColors = useThemeColors();
  const queryClient = useQueryClient();
  const { savingsGoals } = useSavingsGoals();

  const [amount, setAmount] = useState('');
  const [savingsType, setSavingsType] = useState('');
  const [savingsGoalId, setSavingsGoalId] = useState<string>(AD_HOC_GOAL_VALUE);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [typeError, setTypeError] = useState<string | undefined>();

  // Goal options: filtered by selected type + always include ad-hoc
  const goalOptions = useMemo(() => {
    const adHoc = { value: AD_HOC_GOAL_VALUE, label: SAVINGS_DEPOSIT_STRINGS.adHocGoalOption };
    if (!savingsType) return [adHoc];

    const matchingGoals = savingsGoals
      .filter((g) => g.type === savingsType)
      .map((g) => ({ value: g.id, label: g.name }));

    return [adHoc, ...matchingGoals];
  }, [savingsGoals, savingsType]);

  const handleSavingsTypeChange = (value: string | number) => {
    setSavingsType(String(value));
    // Reset goal when type changes since goal options change
    setSavingsGoalId(AD_HOC_GOAL_VALUE);
    setTypeError(undefined);
  };

  const handleGoalChange = (value: string | number) => {
    setSavingsGoalId(String(value));
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    const resolvedGoalId = savingsGoalId === AD_HOC_GOAL_VALUE ? null : savingsGoalId;

    const result = savingsDepositSchema.safeParse({
      amount: amountNum,
      savingsType,
      savingsGoalId: resolvedGoalId,
      description: description.trim() || undefined,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setAmountError(fieldErrors.amount?.[0]);
      setTypeError(fieldErrors.savingsType?.[0]);
      return;
    }

    setAmountError(undefined);
    setTypeError(undefined);
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

      // Reset form
      setAmount('');
      setSavingsType('');
      setSavingsGoalId(AD_HOC_GOAL_VALUE);
      setDescription('');

      onSuccess?.();
    } catch (error) {
      console.error(SAVINGS_DEPOSIT_STRINGS.createFailedLog, error);
      Alert.alert('Error', SAVINGS_DEPOSIT_STRINGS.createFailedAlert);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = parseFloat(amount) > 0 && savingsType.length > 0;

  const currencyPrefix = <BText muted>₹</BText>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <BView gap="md">
        <BInput
          label={SAVINGS_DEPOSIT_STRINGS.amountLabel}
          placeholder={SAVINGS_DEPOSIT_STRINGS.amountPlaceholder}
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setAmountError(undefined);
          }}
          keyboardType="decimal-pad"
          leftIcon={currencyPrefix}
          error={amountError}
        />

        <BDropdown
          label={SAVINGS_DEPOSIT_STRINGS.savingsTypeLabel}
          options={savingsTypeOptions}
          value={savingsType || null}
          onValueChange={handleSavingsTypeChange}
          placeholder={SAVINGS_DEPOSIT_STRINGS.savingsTypePlaceholder}
          modalTitle={SAVINGS_DEPOSIT_STRINGS.savingsTypeModalTitle}
          searchable
          error={typeError}
        />

        <BDropdown
          label={SAVINGS_DEPOSIT_STRINGS.goalLabel}
          options={goalOptions}
          value={savingsGoalId}
          onValueChange={handleGoalChange}
          placeholder={SAVINGS_DEPOSIT_STRINGS.goalPlaceholder}
          modalTitle={SAVINGS_DEPOSIT_STRINGS.goalModalTitle}
        />

        <BInput
          label={SAVINGS_DEPOSIT_STRINGS.descriptionLabel}
          placeholder={SAVINGS_DEPOSIT_STRINGS.descriptionPlaceholder}
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
            {SAVINGS_DEPOSIT_STRINGS.submitButton}
          </BText>
        </BButton>
      </BView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Spacing.base,
  },
});

export default SavingsDepositForm;
