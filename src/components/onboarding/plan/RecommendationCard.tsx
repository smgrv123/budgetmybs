import type { FC } from 'react';

import { RecommendationPriority } from '@/src/constants/financialPlan';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { BText, BView } from '@/src/components/ui';
import { useThemeColors, type ThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { AIRecommendation } from '@/src/types/financialPlan';

type RecommendationCardProps = Pick<AIRecommendation, 'title' | 'description' | 'priority'>;

const getPriorityColors = (priority: AIRecommendation['priority'], themeColors: ThemeColors) => {
  switch (priority) {
    case RecommendationPriority.HIGH:
      return {
        text: themeColors.priorityHigh,
        bg: themeColors.priorityHighBg,
      };
    case RecommendationPriority.MEDIUM:
      return {
        text: themeColors.priorityMedium,
        bg: themeColors.priorityMediumBg,
      };
    case RecommendationPriority.LOW:
      return {
        text: themeColors.priorityLow,
        bg: themeColors.priorityLowBg,
      };
  }
};

const RecommendationCard: FC<RecommendationCardProps> = ({ title, description, priority }) => {
  const themeColors = useThemeColors();
  const colors = getPriorityColors(priority, themeColors);

  return (
    <BView gap={SpacingValue.SM}>
      {/* Title and Priority Badge */}
      <BView row gap={SpacingValue.SM} align="center" justify="space-between">
        <BText variant={TextVariant.LABEL} style={{ flex: 1 }}>
          {title}
        </BText>
        <BView padding={SpacingValue.XS} paddingX={SpacingValue.SM} rounded={SpacingValue.BASE} bg={colors.bg}>
          <BText variant={TextVariant.CAPTION} color={colors.text}>
            {priority.toUpperCase()}
          </BText>
        </BView>
      </BView>

      {/* Description */}
      <BText variant={TextVariant.CAPTION} color={themeColors.textSecondary}>
        {description}
      </BText>
    </BView>
  );
};

export default RecommendationCard;
