import { router } from 'expo-router';
import { useState } from 'react';

import { BButton, BIcon, BText, BView } from '@/src/components';
import { BOnboardingLayout } from '@/src/components/onboarding';
import { OnboardingSplitwiseStrings } from '@/src/constants/onboarding-splitwise.strings';
import { getEnabledSteps } from '@/src/constants/onboarding.config';
import { ButtonVariant, ComponentSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitwise } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { syncSplitwiseExpenses } from '@/src/services/splitwise';

export default function SplitwiseConnectScreen() {
  const themeColors = useThemeColors();
  const { connectAsync, isConnecting } = useSplitwise();
  const [connectError, setConnectError] = useState<string | null>(null);

  // Splitwise connect sits immediately after all data-entry steps, before the AI plan
  const splitwiseStepNumber = getEnabledSteps().length + 1;

  const handleConnect = async () => {
    setConnectError(null);
    try {
      await connectAsync();
      // Fire-and-forget background sync — do not await, do not block navigation
      syncSplitwiseExpenses({ fullSync: true }).catch((err) => {
        console.error('[SplitwiseConnectScreen] Background sync failed:', err);
      });
      router.replace('/onboarding/confirmation');
    } catch {
      setConnectError(OnboardingSplitwiseStrings.errorMessage);
    }
  };

  const handleSkip = () => {
    router.replace('/onboarding/confirmation');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BOnboardingLayout
      title={OnboardingSplitwiseStrings.title}
      currentStep={splitwiseStepNumber}
      showBack
      onBack={handleBack}
    >
      {/* Main content area */}
      <BView flex center paddingX={SpacingValue.XL}>
        {/* Icon area */}
        <BView center marginY={SpacingValue['2XL']}>
          <BView center rounded="full" bg={themeColors.primary} style={{ width: 80, height: 80 }}>
            <BIcon name="people-outline" size={ComponentSize.LG} color={themeColors.white} />
          </BView>
        </BView>

        {/* Subtitle */}
        <BView center gap={SpacingValue.SM}>
          <BText variant={TextVariant.BODY} muted center>
            {OnboardingSplitwiseStrings.subtitle}
          </BText>
        </BView>

        {/* Inline error message */}
        {connectError !== null ? (
          <BView marginY={SpacingValue.MD}>
            <BText variant={TextVariant.CAPTION} color={themeColors.danger} center>
              {connectError}
            </BText>
          </BView>
        ) : null}
      </BView>

      {/* Footer buttons */}
      <BView paddingX={SpacingValue.XL} paddingY={SpacingValue.XL} gap={SpacingValue.MD}>
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={handleConnect}
          loading={isConnecting}
          disabled={isConnecting}
          fullWidth
          rounded={SpacingValue.LG}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isConnecting ? OnboardingSplitwiseStrings.loadingMessage : OnboardingSplitwiseStrings.connectButton}
          </BText>
        </BButton>

        <BButton
          variant={ButtonVariant.GHOST}
          onPress={handleSkip}
          disabled={isConnecting}
          fullWidth
          rounded={SpacingValue.LG}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.textMuted}>
            {OnboardingSplitwiseStrings.skipButton}
          </BText>
        </BButton>
      </BView>
    </BOnboardingLayout>
  );
}
