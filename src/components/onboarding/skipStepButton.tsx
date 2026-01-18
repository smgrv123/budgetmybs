import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { ListStepStrings } from '@/src/types';
import { BButton, BText } from '../ui';

type SkipStepButtonProps = {
  onNext: () => void;
  strings: ListStepStrings;
  showSkip: boolean;
  nextButtonLabel?: string; // Optional custom label for settings reuse
};

export default function BSkipStepButton({ onNext, strings, showSkip, nextButtonLabel }: SkipStepButtonProps) {
  const buttonLabel = nextButtonLabel ?? (showSkip ? strings.continueButton : strings.skipButton);

  return (
    <BButton fullWidth onPress={onNext} style={styles.continueButton}>
      <BText color="#FFFFFF" variant="label">
        {buttonLabel}
      </BText>
    </BButton>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
  },
});
