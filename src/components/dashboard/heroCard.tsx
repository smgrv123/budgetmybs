import React, { FC, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { HealthScoreWeights } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BButton, BIcon, BText, BView } from '../ui';

type DashboardHeroCardProps = {
  carouselCardWidth: number;
  rollover: number;
  handleResetRollover: () => void;
  isResettingRollover: boolean;
  budgetRemaining: number;
  budgetUsedPercent: number;
  carouselLength: boolean;
};

const DashboardHeroCard: FC<DashboardHeroCardProps> = ({
  carouselCardWidth,
  rollover,
  handleResetRollover,
  isResettingRollover,
  budgetRemaining,
  budgetUsedPercent,
  carouselLength,
}) => {
  const themeColors = useThemeColors();

  const [healthScoreWeights, sethealthScoreWeights] = useState<HealthScoreWeights>();

  useEffect(() => {
    const getHealthScoreWeights = async () => {
      const asyncStoreValue = await AsyncStorage.getItem(AsyncStorageKeys.HEALTH_SCORE_WEIGHTS);
      if (!asyncStoreValue) return;
      sethealthScoreWeights(JSON.parse(asyncStoreValue));
    };
    getHealthScoreWeights();
  }, []);

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
        </View>
        <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
          {budgetUsedPercent}% used
        </BText>

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
});

export default DashboardHeroCard;
