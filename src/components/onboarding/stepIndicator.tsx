import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { Colors, Spacing, SpacingValue } from '@/constants/theme';
import { BIcon, BText, BView } from '../ui';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

interface StepDotProps {
  stepNumber: number;
  status: 'completed' | 'active' | 'inactive';
}

const DOT_SIZE = Spacing['2xl'];

const StepDot: FC<StepDotProps> = ({ stepNumber, status }) => {
  if (status === 'completed') {
    return (
      <BView center style={[styles.dot, styles.dotCompleted]}>
        <BIcon name="checkmark" size="sm" color="#FFFFFF" />
      </BView>
    );
  }

  if (status === 'active') {
    return (
      <BView center style={[styles.dot, styles.dotActive]}>
        <BText variant="label" color="#FFFFFF">
          {stepNumber}
        </BText>
      </BView>
    );
  }

  return (
    <BView center style={[styles.dot, styles.dotInactive]}>
      <BText variant="label" color={Colors.light.stepText}>
        {stepNumber}
      </BText>
    </BView>
  );
};

interface StepLineProps {
  completed: boolean;
}

const StepLine: FC<StepLineProps> = ({ completed }) => (
  <BView flex marginX={SpacingValue.SM} style={[styles.line, completed ? styles.lineCompleted : styles.lineInactive]} />
);

const BStepIndicator: FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  const getStepStatus = (step: number): 'completed' | 'active' | 'inactive' => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <BView row style={styles.container}>
      {steps.map((step, index) => (
        <BView row key={step} style={index < totalSteps - 1 && styles.stepWrapperWithLine}>
          <StepDot stepNumber={step} status={getStepStatus(step)} />
          {index < totalSteps - 1 && <StepLine completed={step < currentStep} />}
        </BView>
      ))}
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepWrapperWithLine: {
    flex: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotCompleted: {
    backgroundColor: Colors.light.stepCompleted,
  },
  dotActive: {
    backgroundColor: Colors.light.stepActive,
  },
  dotInactive: {
    backgroundColor: Colors.light.stepInactive,
  },
  line: {
    height: Spacing.xxs,
    marginTop: Spacing.md,
  },
  lineCompleted: {
    backgroundColor: Colors.light.stepCompleted,
  },
  lineInactive: {
    backgroundColor: Colors.light.stepInactive,
  },
});

export default BStepIndicator;
