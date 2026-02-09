import type { FC } from 'react';

import { SpacingValue, TextVariant } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BIcon, BText, BView } from '@/src/components/ui';

type InsightCardProps = {
  insight: string;
};

const InsightCard: FC<InsightCardProps> = ({ insight }) => {
  const themeColors = useThemeColors();

  return (
    <BView row gap={SpacingValue.SM} padding={SpacingValue.SM} rounded={SpacingValue.BASE} bg={themeColors.insightBg}>
      <BIcon name="checkmark-circle" size={SpacingValue.MD} color={themeColors.insightCheck} />
      <BView flex>
        <BText variant={TextVariant.BODY} color={themeColors.text}>
          {insight}
        </BText>
      </BView>
    </BView>
  );
};

export default InsightCard;
