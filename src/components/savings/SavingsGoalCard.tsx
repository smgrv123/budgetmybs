import { LinearGradient } from 'expo-linear-gradient';
import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { SavingsLabels } from '@/db/types';
import type { SavingsType } from '@/db/types';
import { BCard, BIcon, BText, BView } from '@/src/components/ui';
import { SAVINGS_TYPE_ICONS } from '@/src/constants/savings-icons.config';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import { BorderRadius, CardVariant, IconSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

export type SavingsGoalCardProps = {
  goalId: string;
  goalName: string;
  goalType: SavingsType;
  targetAmount: number;
  allTimeTotal: number;
  monthlyDeposited: number;
};

const SavingsGoalCard: FC<SavingsGoalCardProps> = ({
  goalName,
  goalType,
  targetAmount,
  allTimeTotal,
  monthlyDeposited,
}) => {
  const themeColors = useThemeColors();

  const iconName = SAVINGS_TYPE_ICONS[goalType] ?? SAVINGS_TYPE_ICONS.other;
  const typeLabel = SavingsLabels[goalType] ?? goalType;

  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((monthlyDeposited / targetAmount) * 100)) : 0;
  const isTargetMet = monthlyDeposited >= targetAmount && targetAmount > 0;

  const PROGRESS_GRADIENT: [string, string] = [
    themeColors.confirmationGradientStart,
    themeColors.confirmationGradientEnd,
  ];

  return (
    <BCard variant={CardVariant.DEFAULT} gap={SpacingValue.SM}>
      {/* Top row: icon + names on left, amounts on right */}
      <BView row align="center" justify="space-between" gap={SpacingValue.SM}>
        {/* Icon in rounded square */}
        <BView center style={[styles.iconContainer, { backgroundColor: themeColors.primaryFaded }]}>
          <BIcon name={iconName as any} size="md" color={themeColors.primary} />
        </BView>

        {/* Goal name and type */}
        <BView flex gap={SpacingValue.XXS}>
          <BText variant={TextVariant.LABEL}>{goalName}</BText>
          <BText variant={TextVariant.CAPTION} muted>
            {typeLabel}
          </BText>
        </BView>

        {/* Amounts */}
        <BView align="flex-end" gap={SpacingValue.XXS}>
          <BView row align="center" gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL} color={themeColors.primary}>
              {formatCurrency(allTimeTotal)}
            </BText>
            {isTargetMet && (
              <BView center style={[styles.checkBadge, { backgroundColor: themeColors.successBackground }]}>
                <BIcon name="checkmark" size="xs" color={themeColors.success} />
              </BView>
            )}
          </BView>
          <BText variant={TextVariant.CAPTION} muted>
            {SAVINGS_SCREEN_STRINGS.overview.ofTarget} {formatCurrency(targetAmount)}
          </BText>
        </BView>
      </BView>

      {/* Progress bar */}
      <BView style={[styles.progressTrack, { backgroundColor: themeColors.muted }]}>
        {progressPercent > 0 && (
          <LinearGradient
            colors={PROGRESS_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        )}
      </BView>

      {/* Progress caption */}
      <BText variant={TextVariant.CAPTION} muted>
        {isTargetMet
          ? SAVINGS_SCREEN_STRINGS.overview.monthlyTargetMet
          : `${progressPercent}${SAVINGS_SCREEN_STRINGS.overview.percentComplete}`}
      </BText>
    </BCard>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: IconSize['2xl'],
    height: IconSize['2xl'],
    borderRadius: BorderRadius[SpacingValue.MD],
  },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: BorderRadius.full,
  },
  checkBadge: {
    width: IconSize.sm,
    height: IconSize.sm,
    borderRadius: BorderRadius.full,
  },
});

export default SavingsGoalCard;
