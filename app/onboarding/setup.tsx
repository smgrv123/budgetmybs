import { OnboardingStepId } from '@/constants/onboarding.config';
import { OnboardingStrings } from '@/constants/onboarding.strings';
import { BDebtsStep, BFixedExpensesStep, BOnboardingLayout, BProfileStep, BSavingsStep } from '@/src/components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

const STEPS: OnboardingStepId[] = [
  OnboardingStepId.PROFILE,
  OnboardingStepId.FIXED_EXPENSES,
  OnboardingStepId.DEBTS,
  OnboardingStepId.SAVINGS,
];

const { profile: profileStrings, fixedExpenses, debts, savings } = OnboardingStrings;

export default function SetupScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>(OnboardingStepId.PROFILE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current step index (1-indexed for display)
  const stepIndex = STEPS.indexOf(currentStep) + 1;

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
      setErrors({});
    } else {
      router.back();
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
      setErrors({});
    } else {
      // Last step - go to confirmation
      router.push('/onboarding/confirmation');
    }
  }, [currentStep]);

  const getScreenTitle = () => {
    switch (currentStep) {
      case OnboardingStepId.PROFILE:
        return profileStrings.screenTitle;
      case OnboardingStepId.FIXED_EXPENSES:
        return fixedExpenses.screenTitle;
      case OnboardingStepId.DEBTS:
        return debts.screenTitle;
      case OnboardingStepId.SAVINGS:
        return savings.screenTitle;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStepId.PROFILE:
        return <BProfileStep onNext={handleNext} errors={errors} setErrors={setErrors} />;
      case OnboardingStepId.FIXED_EXPENSES:
        return <BFixedExpensesStep onNext={handleNext} />;
      case OnboardingStepId.DEBTS:
        return <BDebtsStep onNext={handleNext} />;
      case OnboardingStepId.SAVINGS:
        return <BSavingsStep onNext={handleNext} />;
    }
  };

  return (
    <BOnboardingLayout title={getScreenTitle()} currentStep={stepIndex} showBack={true} onBack={handleBack}>
      {renderStep()}
    </BOnboardingLayout>
  );
}
