import { LinearGradient } from 'expo-linear-gradient';
import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { SpacingValue, TextVariant } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BText, BView } from '@/src/components/ui';
import type { BudgetAllocationItem } from '@/src/types/financialPlan';
import { formatIndianNumber } from '@/src/utils/format';

type BudgetAllocationCardProps = Pick<BudgetAllocationItem, 'label' | 'amount' | 'percentage'>;

const BudgetAllocationCard: FC<BudgetAllocationCardProps> = ({ label, amount, percentage }) => {
  const themeColors = useThemeColors();

  return (
    <BView gap={SpacingValue.SM}>
      {/* Label and Amount */}
      <BView flex row align="center">
        <BText
          numberOfLines={2}
          ellipsizeMode="tail"
          variant={TextVariant.LABEL}
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {label}
        </BText>
        <BText variant={TextVariant.SUBHEADING} style={{ flexShrink: 0 }}>
          {formatIndianNumber(amount, true)}
        </BText>
      </BView>

      {/* Progress Bar */}
      <BView style={styles.progressTrack} bg={themeColors.muted} rounded={SpacingValue.SM}>
        <LinearGradient
          colors={[themeColors.progressGradientStart, themeColors.progressGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${percentage}%` }]}
        />
      </BView>

      {/* Percentage */}
      <BText variant={TextVariant.CAPTION} color={themeColors.textSecondary}>
        {percentage}% of budget
      </BText>
    </BView>
  );
};

const styles = StyleSheet.create({
  progressTrack: {
    height: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default BudgetAllocationCard;
