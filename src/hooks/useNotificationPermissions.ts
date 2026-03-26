import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Handles notification permission lifecycle on dashboard load.
 * - If undetermined: requests permission once (iOS prompt, Android 13+ prompt, Android <13 auto-granted)
 * - If denied: no-op, never re-prompts
 * - If granted: no-op
 *
 * Also registers a tap listener — tapping any notification navigates to dashboard home.
 */
export const useNotificationPermissions = () => {
  const router = useRouter();

  useEffect(() => {
    const requestIfNeeded = async () => {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'undetermined') {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestIfNeeded();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/dashboard');
    });

    return () => subscription.remove();
  }, [router]);
};
