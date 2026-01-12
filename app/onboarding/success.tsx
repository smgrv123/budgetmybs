import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { BorderRadius, Colors, ComponentSize, Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { BIcon, BSafeAreaView, BText, BView } from '@/src/components';

const { success } = OnboardingStrings;

// Success screen gradient colors
const SUCCESS_GRADIENT: [string, string] = [Colors.light.successGradientStart, Colors.light.successGradientEnd];

// Auto-redirect delay in milliseconds
const REDIRECT_DELAY_MS = 2000;

interface CompletionItem {
  id: string;
  label: string;
  icon: string;
}

export default function SuccessScreen() {
  // Auto-redirect to dashboard after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const renderCompletionItem = ({ item }: { item: CompletionItem }) => (
    <BView row gap={SpacingValue.MD} padding={SpacingValue.MD} style={styles.completionCard}>
      <BView center style={styles.iconContainer}>
        <BIcon name={item.icon as any} color={Colors.light.successCheck} size={ComponentSize.SM} />
      </BView>
      <BText variant={TextVariant.LABEL}>{item.label}</BText>
    </BView>
  );

  return (
    <LinearGradient colors={SUCCESS_GRADIENT} style={styles.gradient}>
      <BSafeAreaView style={styles.safeArea}>
        {/* Main Content - Takes up remaining space and centers vertically */}
        <View style={styles.mainContent}>
          {/* Checkmark Icon */}
          <View style={styles.checkmarkWrapper}>
            <View style={styles.checkmarkCircle}>
              <BIcon name="checkmark" color={Colors.light.successCheck} size={ComponentSize.LG} />
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.textContainer}>
            <BText variant={TextVariant.HEADING} center style={styles.title}>
              {success.title}
            </BText>
            <BText variant={TextVariant.BODY} muted center style={styles.subtitle}>
              {success.subtitle}
            </BText>
          </View>

          {/* Completion List */}
          <BView paddingX={SpacingValue.XL} marginY={SpacingValue.LG}>
            <FlatList
              data={success.completionItems}
              renderItem={renderCompletionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <BView style={{ height: Spacing.sm }} />}
            />
          </BView>
        </View>

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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  checkmarkWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkmarkCircle: {
    width: Spacing['5xl'],
    height: Spacing['5xl'],
    borderRadius: Spacing['5xl'] / 2,
    borderWidth: 3,
    borderColor: Colors.light.successCheck,
    backgroundColor: Colors.light.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    paddingHorizontal: Spacing.md,
  },
  completionCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: Spacing.xl,
    height: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.successCheckBg,
  },
});
