import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';

import {
  IMPULSE_NOTIFICATION_ACTION_CONFIRM,
  IMPULSE_NOTIFICATION_ACTION_SKIP,
  IMPULSE_NOTIFICATION_ID_PREFIX,
} from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { getAllImpulsePurchases, removeImpulsePurchase } from '@/src/utils/impulseAsyncStore';
import { createExpense } from '@/db/queries/expenses';

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
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionIdentifier = response.actionIdentifier;
      const notificationIdentifier = response.notification.request.identifier;

      if (
        actionIdentifier === IMPULSE_NOTIFICATION_ACTION_CONFIRM ||
        actionIdentifier === IMPULSE_NOTIFICATION_ACTION_SKIP
      ) {
        const allPending = await getAllImpulsePurchases();
        const pending = allPending.find((entry) => entry.notificationId === notificationIdentifier);

        if (pending) {
          if (actionIdentifier === IMPULSE_NOTIFICATION_ACTION_CONFIRM) {
            await createExpense({
              amount: pending.purchaseData.amount,
              categoryId: pending.purchaseData.categoryId,
              description: pending.purchaseData.description,
              creditCardId: pending.purchaseData.creditCardId,
              date: pending.purchaseData.date,
              wasImpulse: 1,
            });
          }
          await removeImpulsePurchase(pending.id);
        }
      }

      // If the tapped notification is an impulse notification (body tap, not action button),
      // navigate to the single-purchase confirm screen. Otherwise go to dashboard.
      if (
        actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
        notificationIdentifier.startsWith(IMPULSE_NOTIFICATION_ID_PREFIX)
      ) {
        const entryId = notificationIdentifier.slice(IMPULSE_NOTIFICATION_ID_PREFIX.length);
        router.push(`/impulse-confirm?id=${entryId}`);
      } else {
        router.push('/dashboard');
      }
    });

    return () => subscription.remove();
  }, [router]);

  /** Returns whether notification permissions are currently granted. */
  const checkPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  };

  /**
   * Requests notification permissions.
   * - If undetermined: shows the OS system prompt.
   * - If already denied: OS won't re-prompt — shows an in-app alert directing the user to Settings.
   * Returns whether permissions are granted after the interaction.
   */
  const requestPermissions = async (): Promise<boolean> => {
    const { status: current } = await Notifications.getPermissionsAsync();

    if (current === 'denied') {
      Alert.alert(IMPULSE_STRINGS.permissionDeniedTitle, IMPULSE_STRINGS.permissionDeniedMessage, [
        { text: IMPULSE_STRINGS.permissionDeniedCancel, style: 'cancel' },
        {
          text: IMPULSE_STRINGS.permissionDeniedOpenSettings,
          onPress: () => Linking.openSettings(),
        },
      ]);
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  return { checkPermissions, requestPermissions };
};
