import type { FC } from 'react';

import { SavingsLabels } from '@/db/types';
import type { SavingsType } from '@/db/types';
import type { AdHocSavingsBalance } from '@/db/schema-types';
import { BAccordion, BIcon, BText, BView } from '@/src/components/ui';
import { SAVINGS_TYPE_ICONS } from '@/src/constants/savings-icons.config';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

export type AdHocSavingsAccordionProps = {
  balances: AdHocSavingsBalance[];
};

const AdHocSavingsAccordion: FC<AdHocSavingsAccordionProps> = ({ balances }) => {
  const themeColors = useThemeColors();

  const totalAdHoc = balances.reduce((sum, b) => sum + b.net, 0);

  const accordionTitle = `${SAVINGS_SCREEN_STRINGS.overview.adHocSectionTitle}  ${formatCurrency(totalAdHoc)}`;

  return (
    <BAccordion
      icon={SAVINGS_SCREEN_STRINGS.overview.adHocSectionIcon}
      iconColor={themeColors.success}
      title={accordionTitle}
    >
      <BView gap={SpacingValue.SM}>
        {balances.map((balance) => {
          const type = balance.savingsType as SavingsType;
          const iconName = SAVINGS_TYPE_ICONS[type] ?? SAVINGS_TYPE_ICONS.other;
          const typeLabel = SavingsLabels[type] ?? balance.savingsType;

          return (
            <BView key={balance.savingsType} row align="center" justify="space-between" gap={SpacingValue.SM}>
              <BView row align="center" gap={SpacingValue.SM} flex>
                <BIcon name={iconName as any} size="sm" color={themeColors.success} />
                <BText variant={TextVariant.BODY}>{typeLabel}</BText>
              </BView>
              <BText variant={TextVariant.BODY} color={themeColors.success}>
                {formatCurrency(balance.net)}
              </BText>
            </BView>
          );
        })}
      </BView>
    </BAccordion>
  );
};

export default AdHocSavingsAccordion;
