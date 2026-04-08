import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { initializeCurrentMonth, processRecurringTransactions } from '@/db/queries';
import { BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { Spacing, TextVariant } from '@/src/constants/theme';
import { useCategories, useExpiredImpulseCheck, useProfile } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

/**
 * Root index screen - handles routing based on onboarding status
 * If user has completed onboarding (profile exists) -> Dashboard
 * If not -> Onboarding welcome screen
 */
export default function RootScreen() {
  const { profile, isProfileLoading } = useProfile();
  const { seedCategoryAsync } = useCategories();
  const themeColors = useThemeColors();

  useExpiredImpulseCheck();

  useEffect(() => {
    const processOnAppLoad = async () => {
      await seedCategoryAsync();

      // Process recurring transactions on startup
      const processed = await processRecurringTransactions();

      if (!processed) {
        // >6 months pending — ask user to confirm extended catch-up
        Alert.alert(
          'Missed Recurring Transactions',
          'You have more than 6 months of missed recurring transactions. Process now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Process',
              style: 'default',
              onPress: () => processRecurringTransactions({ allowExtendedCatchup: true }),
            },
          ]
        );
      }
    };

    processOnAppLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const processOnAppLoad = async () => {
      // Initialize monthly snapshot with rollover from previous month
      if (!isProfileLoading && profile?.salary) {
        const initialized = await initializeCurrentMonth(profile.salary);
        if (!initialized) {
          Alert.alert('Missed Monthly Snapshots', 'You have more than 6 months of missed snapshots. Create them now?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Process',
              style: 'default',
              onPress: () => initializeCurrentMonth(profile.salary, { allowExtendedCatchup: true }),
            },
          ]);
        }
      }
    };

    processOnAppLoad();
  }, [isProfileLoading, profile]);

  // Show loading state while checking profile
  if (isProfileLoading) {
    return (
      <BSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <BView flex center>
          <BIcon name="sync" color={themeColors.primary} size="lg" />
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
  },
});
