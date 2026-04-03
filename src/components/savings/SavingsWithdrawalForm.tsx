import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import type { SavingsType } from '@/db/types';
import { IncomeTypeEnum, SavingsLabels } from '@/db/types';
import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { SAVINGS_DEPOSIT_STRINGS } from '@/src/constants/savings-deposit.strings';
import { ButtonVariant, Spacing, TextVariant } from '@/src/constants/theme';
import {
  ADHOC_SAVINGS_BALANCES_QUERY_KEY,
  SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
  useSavingsGoals,
  useIncome,
  useExpenses,
  INCOME_QUERY_KEY,
  MONTHLY_INCOME_SUM_QUERY_KEY,
} from '@/src/hooks';
import { savingsWithdrawalSchema } from '@/src/validation/savings-withdrawal';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

// Prefix for goal-based source keys to distinguish from ad-hoc
const GOAL_KEY_PREFIX = 'goal:';
const ADHOC_KEY_PREFIX = 'adhoc:';

type SavingsWithdrawalFormProps = {
  onSuccess?: () => void;
};

const SavingsWithdrawalForm: FC<SavingsWithdrawalFormProps> = ({ onSuccess }) => {
  const themeColors = useThemeColors();
  const queryClient = useQueryClient();
  const { savingsBalancesAllGoals, adHocSavingsBalances } = useSavingsGoals();
  const { createIncomeAsync } = useIncome();
  const { createExpenseAsync } = useExpenses();

  const [sourceKey, setSourceKey] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceError, setSourceError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();

  // Build source picker options: only sources with net > 0
  const sourceOptions = useMemo(() => {
    const goalOptions = savingsBalancesAllGoals
      .filter((b) => b.net > 0)
      .map((b) => ({
        value: `${GOAL_KEY_PREFIX}${b.goalId}`,
        label: b.goalName,
      }));

    const adHocOptions = adHocSavingsBalances
      .filter((b) => b.net > 0)
      .map((b) => {
        const typeLabel = SavingsLabels[b.savingsType as SavingsType] ?? b.savingsType;
        return {
          value: `${ADHOC_KEY_PREFIX}${b.savingsType}`,
          label: `${typeLabel} ${SAVINGS_DEPOSIT_STRINGS.withdrawalAdHocSuffix}`,
        };
      });

    return [...goalOptions, ...adHocOptions];
  }, [savingsBalancesAllGoals, adHocSavingsBalances]);

  // Derive available balance for selected source
  const availableBalance = useMemo(() => {
    if (!sourceKey) return 0;

    if (sourceKey.startsWith(GOAL_KEY_PREFIX)) {
      const goalId = sourceKey.slice(GOAL_KEY_PREFIX.length);
      return savingsBalancesAllGoals.find((b) => b.goalId === goalId)?.net ?? 0;
    }

    if (sourceKey.startsWith(ADHOC_KEY_PREFIX)) {
      const savingsType = sourceKey.slice(ADHOC_KEY_PREFIX.length);
      return adHocSavingsBalances.find((b) => b.savingsType === savingsType)?.net ?? 0;
    }

    return 0;
  }, [sourceKey, savingsBalancesAllGoals, adHocSavingsBalances]);

  const handleSourceChange = (value: string | number) => {
    setSourceKey(String(value));
    setSourceError(undefined);
    setAmount('');
    setAmountError(undefined);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setAmountError(undefined);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);

    const result = savingsWithdrawalSchema.safeParse({
      amount: amountNum,
      sourceKey,
      availableBalance,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setAmountError(fieldErrors.amount?.[0]);
      setSourceError(fieldErrors.sourceKey?.[0]);
      return;
    }

    // Cross-field validation: amount must not exceed available balance
    if (amountNum > availableBalance) {
      setAmountError(SAVINGS_DEPOSIT_STRINGS.withdrawalValidation.amountExceedsBalance);
      return;
    }

    setAmountError(undefined);
    setSourceError(undefined);
    setIsSubmitting(true);

    try {
      // Resolve goal id and savings type from source key
      let resolvedGoalId: string | null = null;
      let resolvedSavingsType: SavingsType | null = null;

      if (sourceKey.startsWith(GOAL_KEY_PREFIX)) {
        const goalId = sourceKey.slice(GOAL_KEY_PREFIX.length);
        resolvedGoalId = goalId;
        const goalBalance = savingsBalancesAllGoals.find((b) => b.goalId === goalId);
        resolvedSavingsType = (goalBalance?.goalType as SavingsType) ?? null;
      } else if (sourceKey.startsWith(ADHOC_KEY_PREFIX)) {
        resolvedSavingsType = sourceKey.slice(ADHOC_KEY_PREFIX.length) as SavingsType;
      }

      if (!resolvedSavingsType) {
        throw new Error('Could not resolve savings type from source');
      }

      // Write 1: savings withdrawal expense (isSaving=1, isWithdrawal=1)
      await createExpenseAsync({
        amount: result.data.amount,
        isSaving: 1,
        isWithdrawal: 1,
        savingsType: resolvedSavingsType,
        savingsGoalId: resolvedGoalId,
        description: SAVINGS_DEPOSIT_STRINGS.withdrawalFormTitle,
        excludeFromSpending: 1,
      });

      // Write 2: income entry with type savings_withdrawal
      await createIncomeAsync({
        amount: result.data.amount,
        type: IncomeTypeEnum.SAVINGS_WITHDRAWAL,
        description: SAVINGS_DEPOSIT_STRINGS.withdrawalFormTitle,
      });

      // Invalidate savings balance queries
      queryClient.invalidateQueries({ queryKey: SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADHOC_SAVINGS_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });

      // Reset form
      setSourceKey('');
      setAmount('');

      onSuccess?.();
    } catch (error) {
      console.error(SAVINGS_DEPOSIT_STRINGS.withdrawalFailedLog, error);
      Alert.alert('Error', SAVINGS_DEPOSIT_STRINGS.withdrawalFailedAlert);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = sourceKey.length > 0 && parseFloat(amount) > 0;
  const currencyPrefix = <BText muted>₹</BText>;

  return (
    <ScrollView style={{ flex: 1, paddingBottom: Spacing.base }} showsVerticalScrollIndicator={false}>
      <BView gap="md">
        <BDropdown
          label={SAVINGS_DEPOSIT_STRINGS.withdrawalSourceLabel}
          options={sourceOptions}
          value={sourceKey || null}
          onValueChange={handleSourceChange}
          placeholder={SAVINGS_DEPOSIT_STRINGS.withdrawalSourcePlaceholder}
          modalTitle={SAVINGS_DEPOSIT_STRINGS.withdrawalSourceModalTitle}
          searchable
          error={sourceError}
        />

        {sourceKey.length > 0 && (
          <BView row justify="space-between" align="center">
            <BText variant={TextVariant.CAPTION} muted>
              {SAVINGS_DEPOSIT_STRINGS.withdrawalAvailableBalanceLabel}
            </BText>
            <BText variant={TextVariant.BODY} color={themeColors.primary}>
              {formatCurrency(availableBalance)}
            </BText>
          </BView>
        )}

        <BInput
          label={SAVINGS_DEPOSIT_STRINGS.withdrawalAmountLabel}
          placeholder={SAVINGS_DEPOSIT_STRINGS.withdrawalAmountPlaceholder}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          leftIcon={currencyPrefix}
          error={amountError}
        />

        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          fullWidth
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {SAVINGS_DEPOSIT_STRINGS.withdrawalSubmitButton}
          </BText>
        </BButton>
      </BView>
    </ScrollView>
  );
};

export default SavingsWithdrawalForm;
