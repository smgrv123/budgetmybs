import { SpacingValue } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BIcon, BLink, BText, BView } from '@/src/components/ui';
import type { FinancialDataItem } from '@/src/types/settings';

interface FinancialDataRowProps extends FinancialDataItem {
  count: number;
}

export default function FinancialDataRow({ label, icon, iconBgColor, iconColor, route, count }: FinancialDataRowProps) {
  const themeColors = useThemeColors();

  return (
    <BLink href={route}>
      <BView row align="center" justify="space-between" flex paddingY={SpacingValue.XS}>
        <BView row align="center" gap="md">
          <BView center rounded="base" bg={iconBgColor} padding="sm">
            <BIcon name={icon as any} size="sm" color={iconColor} />
          </BView>
          <BView>
            <BText variant="label">{label}</BText>
            <BText variant="caption" muted>
              {count} items
            </BText>
          </BView>
        </BView>
        <BIcon name="chevron-forward" size="sm" color={themeColors.textMuted} />
      </BView>
    </BLink>
  );
}
