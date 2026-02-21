import type { FC } from 'react';

import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { BIcon, BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

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
