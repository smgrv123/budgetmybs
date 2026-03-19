import { BCard, BIcon, BLink, BText, BView } from '@/src/components/ui';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';
import type { FC } from 'react';
import { ActivityIndicator } from 'react-native';

interface SplitBalancesCardProps {
  totalOwed: number;
  totalOwing: number;
  isLoading: boolean;
}

const SplitBalancesCard: FC<SplitBalancesCardProps> = ({ totalOwed, totalOwing, isLoading }) => {
  const themeColors = useThemeColors();

  // Hide when nothing to show and not loading
  if (!isLoading && totalOwed === 0 && totalOwing === 0) return null;

  return (
    <BView paddingX={SpacingValue.LG} style={{ marginTop: Spacing.md }}>
      <BLink href="/splitwise-balances" fullWidth style={{ paddingVertical: 0 }}>
        <BCard variant="default" style={{ padding: Spacing.md }}>
          {/* Header */}
          <BView row align="center" justify="space-between" style={{ marginBottom: Spacing.md }}>
            <BView row align="center" gap={SpacingValue.XS}>
              <BIcon name="people-outline" size="sm" color={themeColors.primary} />
              <BText variant={TextVariant.LABEL}>Split Balances</BText>
            </BView>
            {isLoading ? (
              <ActivityIndicator size="small" color={themeColors.textMuted} />
            ) : (
              <BIcon name="chevron-forward-outline" size="sm" color={themeColors.textMuted} />
            )}
          </BView>

          {/* Balance rows */}
          <BView row justify="space-between">
            <BView>
              <BText variant={TextVariant.CAPTION} muted>
                You are owed
              </BText>
              <BText variant={TextVariant.SUBHEADING} style={{ color: themeColors.success }}>
                {formatCurrency(totalOwed)}
              </BText>
            </BView>
            <BView align="flex-end">
              <BText variant={TextVariant.CAPTION} muted>
                You owe
              </BText>
              <BText variant={TextVariant.SUBHEADING} style={{ color: themeColors.error }}>
                {formatCurrency(totalOwing)}
              </BText>
            </BView>
          </BView>
        </BCard>
      </BLink>
    </BView>
  );
};

export default SplitBalancesCard;
