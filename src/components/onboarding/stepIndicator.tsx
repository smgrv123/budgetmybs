import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BIcon, BText, BView } from '../ui';

export type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

type StepDotProps = {
  stepNumber: number;
  status: 'completed' | 'active' | 'inactive';
};

const DOT_SIZE = Spacing['2xl'];

const StepDot: FC<StepDotProps> = ({ stepNumber, status }) => {
  const themeColors = useThemeColors();

  if (status === 'completed') {
    return (
      <BView center bg={themeColors.stepCompleted} style={styles.dot}>
        <BIcon name="checkmark" size="sm" color="#FFFFFF" />
      </BView>
    );
  }

  if (status === 'active') {
    return (
      <BView center bg={themeColors.stepActive} style={styles.dot}>
        <BText variant="label" color="#FFFFFF">
          {stepNumber}
        </BText>
      </BView>
    );
  }

  return (
    <BView center bg={themeColors.stepInactive} style={styles.dot}>
      <BText variant="label" color={themeColors.stepText}>
        {stepNumber}
      </BText>
    </BView>
  );
};

interface StepLineProps {
  completed: boolean;
}

const StepLine: FC<StepLineProps> = ({ completed }) => {
  const themeColors = useThemeColors();

  return (
    <BView
      flex
      marginX="sm"
      bg={completed ? themeColors.stepCompleted : themeColors.stepInactive}
      style={styles.line}
    />
  );
};

const BStepIndicator: FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  const getStepStatus = (step: number): StepDotProps['status'] => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <BView row align="center" justify="space-between" style={styles.container}>
      {steps.map((step, index) => (
        <BView row flex={index < totalSteps - 1} key={step}>
          <StepDot stepNumber={step} status={getStepStatus(step)} />
          {index < totalSteps - 1 && <StepLine completed={step < currentStep} />}
        </BView>
      ))}
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  line: {
    height: Spacing.xxs,
    marginTop: Spacing.md,
  },
});

export default BStepIndicator;
