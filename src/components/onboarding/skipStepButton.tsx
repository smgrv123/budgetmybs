import { StyleSheet } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { BButton, BText } from '../ui';
import { ListStepStrings } from './listStep';

interface SkipStepButtonProps {
  onNext: () => void;
  strings: ListStepStrings;
  showSkip: boolean;
}

export default function BSkipStepButton({ onNext, strings, showSkip }: SkipStepButtonProps) {
  return (
    <BButton fullWidth onPress={onNext} style={styles.continueButton}>
      <BText color="#FFFFFF" variant="label">
        {showSkip ? strings.continueButton : strings.skipButton}
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
