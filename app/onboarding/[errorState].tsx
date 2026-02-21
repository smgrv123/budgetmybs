import { router, useLocalSearchParams } from 'expo-router';

import { ButtonVariant, ComponentSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { BButton, BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

type ErrorState = 'network' | 'api_failure' | 'timeout';

type ErrorConfig = {
  title: string;
  description: string;
  suggestions: string[];
  icon: string;
  iconColor: string;
  retryText: string;
  skipText?: string;
};

const ERROR_CONFIGS: Record<ErrorState, Omit<ErrorConfig, 'iconColor'>> = {
  network: {
    title: 'No Internet Connection',
    description: "We couldn't connect to the internet. AI analysis requires an active connection.",
    suggestions: [
      'Check your WiFi or mobile data',
      'Try moving to an area with better signal',
      'Restart your router if using WiFi',
    ],
    icon: 'cloud-offline-outline',
    retryText: 'Try Again',
    skipText: 'Proceed Without AI',
  },
  api_failure: {
    title: 'AI Analysis Failed',
    description: 'We encountered an error while generating your financial plan.',
    suggestions: ['The AI service may be temporarily unavailable', 'Your data is safe and saved locally'],
    icon: 'alert-circle',
    retryText: 'Try Again',
    skipText: 'Proceed Without AI',
  },
  timeout: {
    title: 'Request Timed Out',
    description: 'The AI analysis is taking longer than expected.',
    suggestions: ['This may be due to slow internet', 'Try again with a better connection'],
    icon: 'time',
    retryText: 'Try Again',
    skipText: 'Proceed Without AI',
  },
};

/**
 * Dynamic error screen for onboarding flow
 * Uses errorState param to determine which error to show
 * Valid errorState values: 'network' | 'api_failure' | 'timeout'
 */
export default function OnboardingError() {
  const { errorState } = useLocalSearchParams<{ errorState: ErrorState }>();
  const themeColors = useThemeColors();
  const config = ERROR_CONFIGS[errorState || 'api_failure'];
  const iconColor = errorState === 'network' ? themeColors.error : themeColors.warning;

  const handleRetry = () => {
    router.back();
  };

  return (
    <BSafeAreaView style={{ flex: 1 }}>
      <BView flex justify="center" align="center" paddingX="xl" gap={SpacingValue.LG}>
        {/* Error Icon */}
        <BView
          align="center"
          justify="center"
          style={{
            width: Spacing['4xl'],
            height: Spacing['4xl'],
            borderRadius: Spacing['2xl'],
            backgroundColor: `${iconColor}20`,
          }}
        >
          <BIcon name={config.icon as any} size={ComponentSize.LG} color={iconColor} />
        </BView>

        {/* Title */}
        <BText variant={TextVariant.HEADING} style={{ textAlign: 'center' }}>
          {config.title}
        </BText>

        {/* Description */}
        <BText variant={TextVariant.BODY} muted style={{ textAlign: 'center', maxWidth: 360 }}>
          {config.description}
        </BText>

        {/* Suggestions */}
        {config.suggestions && config.suggestions.length > 0 && (
          <BView gap={SpacingValue.SM} style={{ width: '100%', maxWidth: 360 }}>
            <BText variant={TextVariant.LABEL}>What you can do:</BText>
            {config.suggestions.map((suggestion, index) => (
              <BText key={index} variant={TextVariant.CAPTION} muted style={{ paddingLeft: Spacing.sm }}>
                • {suggestion}
              </BText>
            ))}
          </BView>
        )}

        {/* Action Buttons */}
        <BView gap={SpacingValue.MD} style={{ width: '100%', maxWidth: 360 }}>
          <BButton variant={ButtonVariant.PRIMARY} onPress={handleRetry} rounded="lg">
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {config.retryText}
            </BText>
          </BButton>

          {config.skipText && (
            <BButton variant={ButtonVariant.SECONDARY} onPress={handleRetry} rounded="lg">
              <BText variant={TextVariant.LABEL} color={themeColors.text}>
                {config.skipText}
              </BText>
            </BButton>
          )}
        </BView>
      </BView>
    </BSafeAreaView>
  );
}
