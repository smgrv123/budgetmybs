import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { SavingsLabels } from '@/db/types';
import type { AdHocSavingsBalance, GoalSavingsBalance } from '@/db/schema-types';
import { BCard, BText, BView } from '@/src/components/ui';
import { SAVINGS_DEPOSIT_STRINGS } from '@/src/constants/savings-deposit.strings';
import { Spacing, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

type SavingsSummaryProps = {
  goalBalances: GoalSavingsBalance[];
  adHocBalances: AdHocSavingsBalance[];
};

const SavingsSummary: FC<SavingsSummaryProps> = ({ goalBalances, adHocBalances }) => {
  const themeColors = useThemeColors();

  const hasData = goalBalances.length > 0 || adHocBalances.length > 0;

  const totalSaved = goalBalances.reduce((sum, b) => sum + b.net, 0) + adHocBalances.reduce((sum, b) => sum + b.net, 0);

  const getSavingsTypeLabel = (type: string): string => {
    return SavingsLabels[type as keyof typeof SavingsLabels] ?? type;
  };

  return (
    <BView gap="sm">
      <BText variant={TextVariant.LABEL}>{SAVINGS_DEPOSIT_STRINGS.summaryTitle}</BText>

      <BCard>
        {!hasData ? (
          <BText muted center>
            {SAVINGS_DEPOSIT_STRINGS.summaryEmptyLabel}
          </BText>
        ) : (
          <BView gap="sm">
            {goalBalances.map((balance) => (
              <BView key={balance.goalId} row justify="space-between" align="center">
                <BView style={styles.labelContainer}>
                  <BText variant={TextVariant.BODY}>{balance.goalName}</BText>
                  <BText variant={TextVariant.CAPTION} muted>
                    {getSavingsTypeLabel(balance.goalType)}
                  </BText>
                </BView>
                <BText variant={TextVariant.BODY} color={themeColors.primary}>
                  {formatCurrency(balance.net)}
                </BText>
              </BView>
            ))}

            {adHocBalances.map((balance) => (
              <BView key={`adhoc-${balance.savingsType}`} row justify="space-between" align="center">
                <BView style={styles.labelContainer}>
                  <BText variant={TextVariant.BODY}>
                    {getSavingsTypeLabel(balance.savingsType)}{' '}
                    <BText variant={TextVariant.CAPTION} muted>
                      {SAVINGS_DEPOSIT_STRINGS.summaryAdHocSuffix}
                    </BText>
                  </BText>
                </BView>
                <BText variant={TextVariant.BODY} color={themeColors.primary}>
                  {formatCurrency(balance.net)}
                </BText>
              </BView>
            ))}

            <BView
              style={[styles.totalRow, { borderTopColor: themeColors.border }]}
              row
              justify="space-between"
              align="center"
            >
              <BText variant={TextVariant.LABEL}>{SAVINGS_DEPOSIT_STRINGS.summaryTotalLabel}</BText>
              <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                {formatCurrency(totalSaved)}
              </BText>
            </BView>
          </BView>
        )}
      </BCard>
    </BView>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  totalRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
});

export default SavingsSummary;
