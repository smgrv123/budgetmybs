import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Colors, Spacing, TextVariant } from '@/constants/theme';
import { BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useProfile } from '@/src/hooks';

/**
 * Root index screen - handles routing based on onboarding status
 * If user has completed onboarding (profile exists) -> Dashboard
 * If not -> Onboarding welcome screen
 */
export default function RootScreen() {
  const { profile, isProfileLoading } = useProfile();

  // Show loading state while checking profile
  if (isProfileLoading) {
    return (
      <BSafeAreaView style={styles.container}>
        <BView flex center>
          <BIcon name="sync" color={Colors.light.primary} size="lg" />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            Loading...
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  // If profile exists, user has completed onboarding -> go to dashboard
  if (profile) {
    return <Redirect href="/dashboard" />;
  }

  // No profile -> user needs to complete onboarding
  return <Redirect href="/onboarding/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
