import type { FC } from 'react';

import type { Income } from '@/db/schema-types';
import { IncomeLabels, IncomeTypeEnum } from '@/db/types';
import { BLink, BText, BView } from '@/src/components/ui';
import { TransactionCard } from '@/src/components/transaction';
import { DASHBOARD_EXTRA_INCOME_STRINGS } from '@/src/constants/dashboard.strings';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

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

      {displayEntries.map((entry) => {
        const typeLabel =
          entry.type === IncomeTypeEnum.OTHER && entry.customType
            ? entry.customType
            : (IncomeLabels[entry.type] ?? entry.type);

        return (
          <BLink
            key={entry.id}
            href={{ pathname: '/income-detail', params: { id: entry.id } }}
            fullWidth
            style={{ marginBottom: Spacing.sm }}
          >
            <TransactionCard
              id={entry.id}
              description={typeLabel}
              categoryName={entry.description}
              amount={entry.amount}
              date={entry.date}
              isSaving
              categoryIcon="cash-outline"
              isSettlement={entry.type === IncomeTypeEnum.SPLITWISE_SETTLEMENT}
            />
          </BLink>
        );
      })}
    </BView>
  );
};

export default ExtraIncomeSection;
