import type { FC } from 'react';

import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { BIcon, BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FinancialPlan } from '@/src/types/financialPlan';

type SummaryCardProps = Pick<FinancialPlan, 'summary'>;

const SummaryCard: FC<SummaryCardProps> = ({ summary }) => {
  const themeColors = useThemeColors();

  return (
    <BView gap={SpacingValue.SM} padding={SpacingValue.BASE} rounded={SpacingValue.BASE} bg={themeColors.summaryBg}>
      {/* Icon and Label */}
      <BView row gap={SpacingValue.SM} align="center">
        <BIcon name="sparkles" size={SpacingValue.MD} color={themeColors.warning} />
        <BText variant={TextVariant.SUBHEADING}>AI Summary</BText>
      </BView>

      {/* Summary Text */}
      <BText variant={TextVariant.BODY} color={themeColors.text}>
        {summary}
      </BText>
    </BView>
  );
};

export default SummaryCard;
