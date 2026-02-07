import type { FC } from 'react';

import { Colors, SpacingValue, TextVariant } from '@/constants/theme';
import { BIcon, BText, BView } from '@/src/components/ui';

type InsightCardProps = {
  insight: string;
};

const InsightCard: FC<InsightCardProps> = ({ insight }) => {
  return (
    <BView row gap={SpacingValue.SM} padding={SpacingValue.SM} rounded={SpacingValue.BASE} bg={Colors.light.insightBg}>
      <BIcon name="checkmark-circle" size={SpacingValue.MD} color={Colors.light.insightCheck} />
      <BView flex>
        <BText variant={TextVariant.BODY} color={Colors.light.text}>
          {insight}
        </BText>
      </BView>
    </BView>
  );
};

export default InsightCard;
