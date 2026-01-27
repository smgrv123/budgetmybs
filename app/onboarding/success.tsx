import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { Colors, ComponentSize, Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { BCard, BIcon, BSafeAreaView, BText, BView } from '@/src/components';

const { success } = OnboardingStrings;

// Success screen gradient colors
const SUCCESS_GRADIENT: [string, string] = [Colors.light.successGradientStart, Colors.light.successGradientEnd];

// Auto-redirect delay in milliseconds
const REDIRECT_DELAY_MS = 2000;

type CompletionItem = {
  id: string;
  label: string;
  icon: string;
};

export default function SuccessScreen() {
  // Auto-redirect to dashboard after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const RenderCompletionItem = ({ item }: { item: CompletionItem }) => (
    <BCard variant="default" gap="md">
      <BView row align="center" gap="md" padding="md">
        <BView center rounded="full" bg={Colors.light.successCheckBg} style={{ width: Spacing.xl, height: Spacing.xl }}>
          <BIcon name={item.icon as any} color={Colors.light.successCheck} size={ComponentSize.SM} />
        </BView>
        <BText variant={TextVariant.LABEL}>{item.label}</BText>
      </BView>
    </BCard>
  );

  return (
    <LinearGradient colors={SUCCESS_GRADIENT} style={styles.gradient}>
      <BSafeAreaView style={styles.safeArea}>
        {/* Main Content - Takes up remaining space and centers vertically */}
        <BView flex center>
          {/* Checkmark Icon */}
          <BView center marginY="lg">
            <BView
              center
              rounded="full"
              bg={Colors.light.white}
              border={Colors.light.successCheck}
              style={{ width: Spacing['5xl'], height: Spacing['5xl'], borderWidth: 3 }}
            >
              <BIcon name="checkmark" color={Colors.light.successCheck} size={ComponentSize.LG} />
            </BView>
          </BView>

          {/* Title & Subtitle */}
          <BView center gap="sm" paddingX="xl" marginY="xl">
            <BText variant={TextVariant.HEADING} center>
              {success.title}
            </BText>
            <BText variant={TextVariant.BODY} muted center>
              ‸{success.subtitle}
            </BText>
          </BView>

          {/* Completion List */}
          <BView paddingX={SpacingValue.XL} gap={SpacingValue.MD}>
            {success.completionItems.map((item) => (
              <RenderCompletionItem key={item.id} item={item} />
            ))}
          </BView>
        </BView>

        {/* Footer - Redirecting text */}
        <BView center paddingY={SpacingValue.XL}>
          <BText variant={TextVariant.CAPTION} muted>
            {success.redirectingText}
          </BText>
        </BView>
      </BSafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
