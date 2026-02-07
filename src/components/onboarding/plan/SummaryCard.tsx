import type { FC } from 'react';

import { Colors, SpacingValue, TextVariant } from '@/constants/theme';
import { BIcon, BText, BView } from '@/src/components/ui';
import type { FinancialPlan } from '@/src/types/financialPlan';

type SummaryCardProps = Pick<FinancialPlan, 'summary'>;

const SummaryCard: FC<SummaryCardProps> = ({ summary }) => {
  return (
    <BView gap={SpacingValue.SM} padding={SpacingValue.BASE} rounded={SpacingValue.BASE} bg={Colors.light.summaryBg}>
      {/* Icon and Label */}
      <BView row gap={SpacingValue.SM} align="center">
        <BIcon name="sparkles" size={SpacingValue.MD} color={Colors.light.warning} />
        <BText variant={TextVariant.SUBHEADING}>AI Summary</BText>
      </BView>

      {/* Summary Text */}
      <BText variant={TextVariant.BODY} color={Colors.light.text}>
        {summary}
      </BText>
    </BView>
  );
};

export default SummaryCard;
