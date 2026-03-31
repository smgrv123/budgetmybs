import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import type { SavingsType } from '@/db/types';
import { IncomeTypeEnum, SavingsLabels } from '@/db/types';
import { createExpense, createIncome } from '@/db';
import { BButton, BCard, BDropdown, BIcon, BInput, BText, BView } from '@/src/components/ui';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  ADHOC_SAVINGS_BALANCES_QUERY_KEY,
  INCOME_QUERY_KEY,
  MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
  MONTHLY_INCOME_SUM_QUERY_KEY,
  SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
  useSavingsGoals,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';
import { useQueryClient } from '@tanstack/react-query';

const GOAL_KEY_PREFIX = 'goal:';
const ADHOC_KEY_PREFIX = 'adhoc:';

const { withdraw: STRINGS } = SAVINGS_SCREEN_STRINGS;

interface SavingsWithdrawTabProps {
  onSuccess: (message: string) => void;
}

const SavingsWithdrawTab: FC<SavingsWithdrawTabProps> = ({ onSuccess }) => {
  const themeColors = useThemeColors();
  const queryClient = useQueryClient();
  const { savingsBalancesAllGoals, adHocSavingsBalances } = useSavingsGoals();

  const [sourceKey, setSourceKey] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ source?: string; amount?: string }>({});

  // Build source options: only sources with net > 0
  const sourceOptions = useMemo(() => {
    const goalOptions = savingsBalancesAllGoals
      .filter((b) => b.net > 0)
      .map((b) => ({
        value: `${GOAL_KEY_PREFIX}${b.goalId}`,
        label: `${b.goalName} (${formatCurrency(b.net)})`,
      }));

    const adHocOptions = adHocSavingsBalances
      .filter((b) => b.net > 0)
      .map((b) => {
        const typeLabel = SavingsLabels[b.savingsType as SavingsType] ?? b.savingsType;
        return {
          value: `${ADHOC_KEY_PREFIX}${b.savingsType}`,
          label: `${typeLabel} ${STRINGS.adHocSuffix} (${formatCurrency(b.net)})`,
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
    setAmount('');
    setErrors({});
  };

  const resetForm = () => {
    setSourceKey('');
    setAmount('');
    setReason('');
    setErrors({});
  };

  const handleSubmit = async () => {
    const newErrors: { source?: string; amount?: string } = {};

    if (!sourceKey) {
      newErrors.source = STRINGS.validation.sourceRequired;
    }

    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      newErrors.amount = STRINGS.validation.amountRequired;
    } else if (amountNum > availableBalance) {
      newErrors.amount = STRINGS.validation.amountExceedsBalance;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Resolve goalId and savingsType from source key
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

      const description = reason.trim() || STRINGS.withdrawalDescription;

      // Write 1: savings withdrawal expense (isSaving=1, isWithdrawal=1)
      await createExpense({
        amount: amountNum,
        isSaving: 1,
        isWithdrawal: 1,
        savingsType: resolvedSavingsType,
        savingsGoalId: resolvedGoalId,
        description,
        excludeFromSpending: 1,
      });

      // Write 2: income entry with type savings_withdrawal
      await createIncome({
        amount: amountNum,
        type: IncomeTypeEnum.SAVINGS_WITHDRAWAL,
        description,
      });

      queryClient.invalidateQueries({ queryKey: SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADHOC_SAVINGS_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_SUM_QUERY_KEY });

      const formattedAmount = amountNum.toLocaleString('en-IN');
      resetForm();
      onSuccess(`₹${formattedAmount} withdrawn from savings!`);
    } catch (error) {
      console.error(STRINGS.withdrawalFailedLog, error);
      Alert.alert('Error', STRINGS.withdrawalFailedAlert);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = sourceKey.length > 0 && Number(amount) > 0 && Number(amount) <= availableBalance;

  const currencyPrefix = <BText muted>₹</BText>;

  return (
    <BView padding={SpacingValue.LG} gap="md" style={styles.container}>
      <BText variant={TextVariant.SUBHEADING}>{STRINGS.title}</BText>
      <BText variant={TextVariant.BODY} muted>
        {STRINGS.subtitle}
      </BText>

      <BDropdown
        label={STRINGS.sourceLabel}
        options={sourceOptions}
        value={sourceKey || null}
        onValueChange={handleSourceChange}
        placeholder={STRINGS.sourcePlaceholder}
        modalTitle={STRINGS.sourceModalTitle}
        searchable
        error={errors.source}
      />

      {sourceKey.length > 0 && (
        <BView row justify="space-between" align="center">
          <BText variant={TextVariant.CAPTION} muted>
            {STRINGS.availableBalanceLabel}
          </BText>
          <BText variant={TextVariant.BODY} color={themeColors.primary}>
            {formatCurrency(availableBalance)}
          </BText>
        </BView>
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
        label={STRINGS.reasonLabel}
        placeholder={STRINGS.reasonPlaceholder}
        value={reason}
        onChangeText={setReason}
      />

      {/* Warning Banner */}
      <BCard
        style={[
          styles.warningBanner,
          {
            backgroundColor: themeColors.warningBackground,
            borderColor: themeColors.warning,
          },
        ]}
      >
        <BView row gap={SpacingValue.SM} align="center">
          <BIcon name="warning-outline" size="md" color={themeColors.warning} />
          <BText variant={TextVariant.CAPTION} color={themeColors.warning} style={styles.warningText}>
            {STRINGS.warningBanner}
          </BText>
        </BView>
      </BCard>

      <BButton
        variant={ButtonVariant.DANGER}
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
  warningBanner: {
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
  },
  warningText: {
    flex: 1,
  },
});

export default SavingsWithdrawTab;
