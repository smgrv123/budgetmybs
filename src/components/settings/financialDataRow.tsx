import { BIcon, BLink, BText, BView } from '@/src/components/ui';
import { SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
import { SpacingValue } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FinancialDataItem } from '@/src/types/settings';

interface FinancialDataRowProps extends FinancialDataItem {
  count: number;
}

export default function FinancialDataRow({
  label,
  icon,
  iconBgColor,
  iconColor,
  route,
  count,
  countSuffix,
}: FinancialDataRowProps) {
  const themeColors = useThemeColors();
  const suffix = countSuffix ?? SETTINGS_COMMON_STRINGS.itemsSuffix;

  return (
    <BLink fullWidth href={route}>
      <BView row align="center" justify="space-between" flex paddingY={SpacingValue.XS}>
        <BView row align="center" gap="md">
          <BView center rounded="base" bg={iconBgColor} padding="sm">
            <BIcon name={icon as any} size="sm" color={iconColor} />
          </BView>
          <BView>
            <BText variant="label">{label}</BText>
            <BText variant="caption" muted>
              {count} {suffix}
            </BText>
          </BView>
        </BView>
        <BIcon name="chevron-forward" size="sm" color={themeColors.textMuted} />
      </BView>
    </BLink>
  );
}
