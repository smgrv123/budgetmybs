import type { FC } from 'react';

import { Colors, SpacingValue, TextVariant } from '@/constants/theme';
import { BIcon, BText, BView } from '@/src/components/ui';
import type { SuggestedChange } from '@/src/types/financialPlan';
import { formatIndianNumber } from '@/src/utils/format';

type SuggestedChangeCardProps = Pick<
  SuggestedChange,
  'itemName' | 'currentValue' | 'suggestedValue' | 'reason' | 'impact'
>;

const SuggestedChangeCard: FC<SuggestedChangeCardProps> = ({
  itemName,
  currentValue,
  suggestedValue,
  reason,
  impact,
}) => {
  const difference = suggestedValue - currentValue;
  const isIncrease = difference > 0;

  return (
    <BView gap={SpacingValue.SM}>
      {/* Item Name */}
      <BText variant={TextVariant.LABEL}>{itemName}</BText>

      {/* Current → Suggested */}
      <BView gap={SpacingValue.SM}>
        <BView row gap={SpacingValue.SM} align="center">
          <BText variant={TextVariant.BODY} color={Colors.light.textSecondary}>
            {formatIndianNumber(currentValue, true)}
          </BText>
          <BIcon name="arrow-forward" size={SpacingValue.SM} color={Colors.light.textMuted} />
          <BText variant={TextVariant.SUBHEADING} color={isIncrease ? Colors.light.danger : Colors.light.success}>
            {formatIndianNumber(suggestedValue, true)}
          </BText>
        </BView>
        <BView row gap={SpacingValue.XS} align="center">
          <BIcon
            name={isIncrease ? 'trending-up' : 'trending-down'}
            size={SpacingValue.SM}
            color={isIncrease ? Colors.light.danger : Colors.light.success}
          />
          <BText variant={TextVariant.CAPTION} color={isIncrease ? Colors.light.danger : Colors.light.success}>
            {isIncrease ? '+' : ''}
            {formatIndianNumber(Math.abs(difference), true)}
          </BText>
        </BView>
      </BView>

      {/* Reason */}
      <BText variant={TextVariant.CAPTION} color={Colors.light.textSecondary}>
        {reason}
      </BText>

      {/* Impact Badge */}
      <BView padding={SpacingValue.SM} rounded={SpacingValue.BASE} bg={Colors.light.impactBg}>
        <BText variant={TextVariant.CAPTION} color={Colors.light.textSecondary}>
          {impact}
        </BText>
      </BView>
    </BView>
  );
};

export default SuggestedChangeCard;
