import { BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

interface BudgetOverviewRowProps {
  label: string;
  value: number;
  isNegative?: boolean;
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
