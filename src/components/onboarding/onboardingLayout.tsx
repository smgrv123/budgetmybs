import type { FC, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { getTotalSteps } from '@/constants/onboarding.config';
import { Colors, Spacing } from '@/constants/theme';
import { BButton, BIcon, BSafeAreaView, BText, BView } from '../ui';
import BStepIndicator from './stepIndicator';

export interface OnboardingLayoutProps {
  title: string;
  currentStep: number;
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  showStepIndicator?: boolean;
}

const BOnboardingLayout: FC<OnboardingLayoutProps> = ({
  title,
  currentStep,
  showBack = true,
  onBack,
  children,
  footer,
  showStepIndicator = true,
}) => {
  const totalSteps = getTotalSteps();

  return (
    <BSafeAreaView>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <BView row paddingX="base" paddingY="md" style={styles.header}>
          {showBack && onBack ? (
            <BButton variant="ghost" onPress={onBack} style={styles.backButton}>
              <BIcon name="chevron-back" size={'base'} color={Colors.light.text} />
            </BButton>
          ) : (
            <BView style={styles.backButtonPlaceholder} />
          )}
          <BText variant="subheading">{title}</BText>
          <BView style={styles.backButtonPlaceholder} />
        </BView>

        {/* Step Indicator */}
        {showStepIndicator && (
          <BView paddingX="base" style={styles.stepIndicatorPadding}>
            <BStepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </BView>
        )}

        {/* Main Content */}
        <BView flex paddingX="base">
          {children}
        </BView>

        {/* Footer */}
        {footer && (
          <BView paddingX="base" paddingY="base" bg="background" style={styles.footer}>
            {footer}
          </BView>
        )}
      </KeyboardAvoidingView>
    </BSafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.lg,
  },
  backButtonPlaceholder: {
    width: Spacing['3xl'],
  },
  stepIndicatorPadding: {
    paddingBottom: Spacing.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});

export default BOnboardingLayout;
