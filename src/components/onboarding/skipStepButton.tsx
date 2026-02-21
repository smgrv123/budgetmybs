import { StyleSheet } from 'react-native';

import { BorderRadius, Spacing } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { ListStepStrings } from '@/src/types';
import { BButton, BText, BView } from '../ui';

type SkipStepButtonProps = {
  onNext: () => void;
  strings: ListStepStrings;
  showSkip: boolean;
  nextButtonLabel?: string; // Optional custom label for settings reuse
};

export default function BSkipStepButton({ onNext, strings, showSkip, nextButtonLabel }: SkipStepButtonProps) {
  const themeColors = useThemeColors();
  const buttonLabel = nextButtonLabel ?? (showSkip ? strings.continueButton : strings.skipButton);

  return (
    <BView paddingY="sm">
      <BButton fullWidth onPress={onNext} style={[styles.continueButton, { backgroundColor: themeColors.primary }]}>
        <BText color="#FFFFFF" variant="label">
          {buttonLabel}
        </BText>
      </BButton>
    </BView>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
  },
});
