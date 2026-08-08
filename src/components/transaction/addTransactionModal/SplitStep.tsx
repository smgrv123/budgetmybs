/**
 * SplitStep
 *
 * Step 2 of the Add Expense carousel. Renders the Splitwise split configuration
 * and two CTAs:
 *   - Back button (top-left) — returns to Step 1 and resets split state
 *   - "Add & Split" (primary) — saves locally + pushes to Splitwise
 */

import type { FC } from 'react';
import { ScrollView } from 'react-native';

import { SplitConfig } from '@/src/components/splitwise';
import { BButton, BText, ScreenHeader } from '@/src/components/ui';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { ButtonVariant, Spacing, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { SplitFormState } from '@/src/types/splitwise-outbound';

export type SplitStepProps = {
  splitState: SplitFormState;
  onSplitChange: (updates: Partial<SplitFormState>) => void;
  totalAmount: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  onAddAndSplit: () => void;
  onBack: () => void;
};

const SplitStep: FC<SplitStepProps> = ({
  splitState,
  onSplitChange,
  totalAmount,
  isSubmitting,
  canSubmit,
  onAddAndSplit,
  onBack,
}) => {
  const themeColors = useThemeColors();

  return (
    <>
      <ScreenHeader
        onBack={onBack}
        title={SPLITWISE_OUTBOUND_STRINGS.splitToggleLabel}
        titleVariant={TextVariant.SUBHEADING}
        containerStyles={{ paddingVertical: Spacing.none }}
      />

      {/* Split configuration scroll area */}
      <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
        <SplitConfig state={splitState} onChange={onSplitChange} totalAmount={totalAmount} />
      </ScrollView>

      <BButton
        variant={ButtonVariant.PRIMARY}
        onPress={onAddAndSplit}
        loading={isSubmitting}
        disabled={!canSubmit || isSubmitting}
        fullWidth
      >
        <BText variant={TextVariant.LABEL} color={themeColors.white}>
          {SPLITWISE_OUTBOUND_STRINGS.addAndSplitCta}
        </BText>
      </BButton>
    </>
  );
};

export default SplitStep;
