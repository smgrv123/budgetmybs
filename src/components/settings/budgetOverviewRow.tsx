import { BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { BudgetOverviewItem } from '@/src/types/settings';

interface BudgetOverviewRowProps extends BudgetOverviewItem {
  value: number;
}

export default function BudgetOverviewRow({ label, value, isNegative }: BudgetOverviewRowProps) {
  const themeColors = useThemeColors();
  const formattedValue = `₹${value.toLocaleString('en-IN')}`;
  const displayValue = isNegative ? `-${formattedValue}` : formattedValue;
  const valueColor = isNegative ? themeColors.error : themeColors.text;

  return (
    <BView row justify="space-between" paddingY="sm">
      <BText variant="body">{label}</BText>
      <BText variant="body" color={valueColor}>
        {displayValue}
      </BText>
    </BView>
  );
}
