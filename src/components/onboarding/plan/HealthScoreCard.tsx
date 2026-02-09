import type { FC } from 'react';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { CardVariant, SpacingValue, TextVariant } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BCard, BIcon, BText, BView } from '@/src/components/ui';

type HealthScoreCardProps = {
  originalScore: number;
  suggestedScore: number;
};

const HealthScoreCard: FC<HealthScoreCardProps> = ({ originalScore, suggestedScore }) => {
  const themeColors = useThemeColors();
  const improvement = suggestedScore - originalScore;
  const strings = OnboardingStrings.aiPlan;

  return (
    <BCard variant={CardVariant.DEFAULT} gap={SpacingValue.BASE}>
      {/* Header */}
      <BView row gap={SpacingValue.SM} align="center">
        <BIcon name="trending-up" size={SpacingValue.MD} color={themeColors.success} />
        <BText variant={TextVariant.SUBHEADING}>{strings.healthScore}</BText>
      </BView>

      {/* Score Comparison */}
      <BView row gap={SpacingValue.LG} align="center" justify="space-between">
        {/* Current Score */}
        <BView gap={SpacingValue.XS} center>
          <BText variant={TextVariant.LABEL} color={themeColors.textSecondary}>
            {strings.current}
          </BText>
          <BView row gap={SpacingValue.XS} align="center">
            <BText variant={TextVariant.HEADING}>{originalScore}</BText>
            <BText variant={TextVariant.BODY} color={themeColors.textMuted}>
              /100
            </BText>
          </BView>
        </BView>

        {/* Arrow */}
        <BIcon name="arrow-forward" size={SpacingValue.MD} color={themeColors.textMuted} />

        {/* Optimized Score */}
        <BView gap={SpacingValue.XS} center>
          <BText variant={TextVariant.LABEL} color={themeColors.textSecondary}>
            {strings.optimized}
          </BText>
          <BView row gap={SpacingValue.XS} align="center">
            <BText variant={TextVariant.HEADING} color={themeColors.healthScoreGreen}>
              {suggestedScore}
            </BText>
            <BText variant={TextVariant.BODY} color={themeColors.textMuted}>
              /100
            </BText>
          </BView>
        </BView>
      </BView>

      {/* Divider & Improvement Badge */}
      {improvement > 0 && (
        <>
          <BView
            style={{
              height: 1,
              backgroundColor: themeColors.border,
            }}
          />
          <BView
            row
            gap={SpacingValue.XS}
            center
            padding={SpacingValue.SM}
            rounded={SpacingValue.BASE}
            bg={themeColors.successBackground}
          >
            <BIcon name="trending-up" size={SpacingValue.SM} color={themeColors.healthScoreGreen} />
            <BText variant={TextVariant.LABEL} color={themeColors.healthScoreGreen}>
              +{improvement} {strings.pointImprovement}
            </BText>
          </BView>
        </>
      )}
    </BCard>
  );
};

export default HealthScoreCard;
