import React, { FC, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { INCOME_SETTINGS_STRINGS } from '@/src/constants/income.strings';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { HealthScoreWeights } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BButton, BIcon, BText, BView } from '../ui';

type DashboardHeroCardProps = {
  carouselCardWidth: number;
  rollover: number;
  additionalIncome: number;
  handleResetRollover: () => void;
  isResettingRollover: boolean;
  budgetRemaining: number;
  budgetUsedPercent: number;
  carouselLength: boolean;
  /** Total unsettled receivable amount from Splitwise (shown as green "in transit" segment) */
  totalReceivable?: number;
  /** Effective monthly budget used to compute in-transit segment width */
  effectiveBudget?: number;
  /** Total amount others owe you — shown as balance chips below the progress bar */
  totalOwedToYou?: number;
  /** Total amount you owe others — shown as balance chips below the progress bar */
  totalYouOwe?: number;
  /** Called when user taps the balance section to navigate to balances screen */
  onBalancesPress?: () => void;
};

const DashboardHeroCard: FC<DashboardHeroCardProps> = ({
  carouselCardWidth,
  rollover,
  additionalIncome,
  handleResetRollover,
  isResettingRollover,
  budgetRemaining,
  budgetUsedPercent,
  carouselLength,
  totalReceivable = 0,
  effectiveBudget = 0,
  totalOwedToYou = 0,
  totalYouOwe = 0,
  onBalancesPress,
}) => {
  const themeColors = useThemeColors();
  const netBalance = totalOwedToYou - totalYouOwe;

  const [healthScoreWeights, sethealthScoreWeights] = useState<HealthScoreWeights>();

  useEffect(() => {
    const getHealthScoreWeights = async () => {
      const asyncStoreValue = await AsyncStorage.getItem(AsyncStorageKeys.HEALTH_SCORE_WEIGHTS);
      if (!asyncStoreValue) return;
      sethealthScoreWeights(JSON.parse(asyncStoreValue));
    };
    getHealthScoreWeights();
  }, []);

  const balanceChips = [
    {
      label: SPLITWISE_BALANCES_STRINGS.youAreOwedLabel,
      amount: totalOwedToYou,
      color: themeColors.success,
      backgroundColor: themeColors.successBackground,
    },
    {
      label: SPLITWISE_BALANCES_STRINGS.youOweLabel,
      amount: totalYouOwe,
      color: themeColors.error,
      backgroundColor: themeColors.errorBackground,
    },
  ].filter((chip) => chip.amount > 0);

  return (
    <BView style={{ width: carouselCardWidth, marginRight: carouselLength ? Spacing.md : 0 }}>
      <BView
        padding={SpacingValue.LG}
        bg={themeColors.background}
        style={[styles.budgetCard, { shadowColor: themeColors.text }]}
      >
        <BText variant={TextVariant.CAPTION} muted style={{ marginBottom: Spacing.xs }}>
          Monthly Budget Remaining
        </BText>
        {rollover > 0 && (
          <BView row align="center" style={{ marginBottom: Spacing.xxs }}>
            <BText variant={TextVariant.CAPTION} style={{ color: themeColors.success }}>
              +{formatCurrency(rollover)} from last month
            </BText>
            <BButton
              variant={ButtonVariant.GHOST}
              onPress={handleResetRollover}
              loading={isResettingRollover}
              style={{ marginLeft: Spacing.xs, padding: Spacing.xxs }}
            >
              <BIcon name="close-circle-outline" color={themeColors.textMuted} size="sm" />
            </BButton>
          </BView>
        )}
        {additionalIncome > 0 && (
          <BView row align="center" style={{ marginBottom: Spacing.xxs }}>
            <BIcon name="arrow-up-circle-outline" color={themeColors.success} size="sm" />
            <BText variant={TextVariant.CAPTION} style={{ color: themeColors.success, marginLeft: Spacing.xxs }}>
              {INCOME_SETTINGS_STRINGS.budget.additionalIncomeBadge(formatCurrency(additionalIncome))}
            </BText>
          </BView>
        )}
        <BText variant={TextVariant.HEADING} style={{ marginBottom: Spacing.md }}>
          {formatCurrency(budgetRemaining)}
        </BText>
        {/* Progress Bar */}
        <View style={[styles.progressBarBg, { backgroundColor: themeColors.muted }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(budgetUsedPercent, 100)}%`, backgroundColor: themeColors.primary },
            ]}
          />
          {netBalance > 0 && effectiveBudget > 0 && (
            <View
              style={[
                styles.progressBarInTransit,
                {
                  width: `${Math.min((netBalance / effectiveBudget) * 100, Math.max(0, 100 - budgetUsedPercent))}%`,
                  backgroundColor: themeColors.success,
                  left: `${Math.min(budgetUsedPercent, 100)}%`,
                },
              ]}
            />
          )}
        </View>
        <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
          {budgetUsedPercent}% used
          {netBalance !== 0 && (
            <BText
              variant={TextVariant.CAPTION}
              style={{ color: netBalance > 0 ? themeColors.success : themeColors.error }}
            >
              {'  ·  '}
              {netBalance < 0 ? '-' : ''}
              {formatCurrency(Math.abs(netBalance))} {SPLITWISE_BALANCES_STRINGS.inTransitLabel}
            </BText>
          )}
        </BText>

        {balanceChips.length > 0 && (
          <BButton variant={ButtonVariant.GHOST} onPress={onBalancesPress} style={styles.balanceButton}>
            <BView row gap={SpacingValue.SM} style={styles.balanceRow}>
              {balanceChips.map((chip) => (
                <BView key={chip.label} flex style={[styles.balanceChip, { backgroundColor: chip.backgroundColor }]}>
                  <BText variant={TextVariant.CAPTION} style={{ color: chip.color }}>
                    {chip.label}
                  </BText>
                  <BText variant={TextVariant.LABEL} style={{ color: chip.color }}>
                    {formatCurrency(chip.amount)}
                  </BText>
                </BView>
              ))}
            </BView>
          </BButton>
        )}

        {/* <HealthScoreCard /> */}
      </BView>
    </BView>
  );
};

const styles = StyleSheet.create({
  budgetCard: {
    borderRadius: BorderRadius.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressBarBg: {
    height: Spacing.xs,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  progressBarInTransit: {
    position: 'absolute',
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  balanceButton: {
    marginTop: Spacing.md,
    padding: 0,
  },
  balanceRow: {
    width: '100%',
  },
  balanceChip: {
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
  },
});

export default DashboardHeroCard;
