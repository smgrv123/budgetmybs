import type { FC } from 'react';

import { RecommendationPriority } from '@/constants/financialPlan';
import { Colors, SpacingValue, TextVariant } from '@/constants/theme';
import { BText, BView } from '@/src/components/ui';
import type { AIRecommendation } from '@/src/types/financialPlan';

type RecommendationCardProps = Pick<AIRecommendation, 'title' | 'description' | 'priority'>;

const getPriorityColors = (priority: AIRecommendation['priority']) => {
  switch (priority) {
    case RecommendationPriority.HIGH:
      return {
        text: Colors.light.priorityHigh,
        bg: Colors.light.priorityHighBg,
      };
    case RecommendationPriority.MEDIUM:
      return {
        text: Colors.light.priorityMedium,
        bg: Colors.light.priorityMediumBg,
      };
    case RecommendationPriority.LOW:
      return {
        text: Colors.light.priorityLow,
        bg: Colors.light.priorityLowBg,
      };
  }
};

const RecommendationCard: FC<RecommendationCardProps> = ({ title, description, priority }) => {
  const colors = getPriorityColors(priority);

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
      <BText variant={TextVariant.CAPTION} color={Colors.light.textSecondary}>
        {description}
      </BText>
    </BView>
  );
};

export default RecommendationCard;
