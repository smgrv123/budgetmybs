import type { FC } from 'react';

import type { Income } from '@/db/schema-types';
import { IncomeLabels } from '@/db/types';
import { BCard, BIcon, BLink, BText, BView } from '@/src/components/ui';
import { DASHBOARD_EXTRA_INCOME_STRINGS } from '@/src/constants/dashboard.strings';
import { CardVariant, IconSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

interface IncomeEntryCardProps {
  entry: Income;
}

const IncomeEntryCard: FC<IncomeEntryCardProps> = ({ entry }) => {
  const themeColors = useThemeColors();
  const typeLabel = IncomeLabels[entry.type];
  const iconBg = `${themeColors.success}20`;

  return (
    <BLink
      href={{ pathname: '/income-detail', params: { id: entry.id } }}
      fullWidth
      style={{ marginBottom: Spacing.sm }}
    >
      <BCard variant={CardVariant.SUMMARY}>
        <BView row align="center" justify="space-between">
          <BView
            center
            style={{
              backgroundColor: themeColors.successBackground,
              marginRight: Spacing.md,
            }}
          >
            <BView
              center
              rounded="base"
              style={{ width: IconSize['2xl'], height: IconSize['2xl'], backgroundColor: iconBg }}
            >
              <BIcon name="cash-outline" color={themeColors.success} size="md" />
            </BView>
          </BView>

          <BView flex>
            <BText variant={TextVariant.LABEL}>{typeLabel}</BText>
            {Boolean(entry.description) && (
              <BText variant={TextVariant.CAPTION} muted>
                {entry.description}
              </BText>
            )}
          </BView>

          <BText style={{ color: themeColors.success }}>+{formatCurrency(entry.amount)}</BText>
        </BView>
      </BCard>
    </BLink>
  );
};

interface ExtraIncomeSectionProps {
  incomeEntries: Income[];
}

const ExtraIncomeSection: FC<ExtraIncomeSectionProps> = ({ incomeEntries }) => {
  const themeColors = useThemeColors();

  if (incomeEntries.length === 0) {
    return null;
  }

  const displayEntries = incomeEntries.slice(0, 2);

  return (
    <BView paddingX={SpacingValue.LG} marginY={SpacingValue.SM}>
      <BView row justify="space-between" align="center" style={{ marginBottom: Spacing.md }}>
        <BText variant={TextVariant.SUBHEADING}>{DASHBOARD_EXTRA_INCOME_STRINGS.sectionTitle}</BText>
        <BLink href="/all-income">
          <BText variant={TextVariant.CAPTION} style={{ color: themeColors.primary }}>
            {DASHBOARD_EXTRA_INCOME_STRINGS.viewAll}
          </BText>
        </BLink>
      </BView>

      {displayEntries.map((entry) => (
        <IncomeEntryCard key={entry.id} entry={entry} />
      ))}
    </BView>
  );
};

export default ExtraIncomeSection;
