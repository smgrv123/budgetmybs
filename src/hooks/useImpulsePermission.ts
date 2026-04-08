import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { IMPULSE_PERMISSION_ASK_THRESHOLDS, IMPULSE_PERMISSION_MAX_ASK_COUNT } from '@/src/constants/impulse.config';
import { useNotificationPermissions } from '@/src/hooks/useNotificationPermissions';

/**
 * Manages notification permission gating for the Impulse Buy Cooldown feature.
 *
 * - Tracks how many times the impulse toggle has been activated (persisted in AsyncStorage).
 * - On the 1st, 3rd, and 10th activation, prompts the user for notification permissions.
 * - After the 10th activation, never asks again.
 * - All permission check/request logic is delegated to `useNotificationPermissions`.
 */
export const useImpulsePermission = () => {
  const { checkPermissions, requestPermissions } = useNotificationPermissions();
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // Sync on mount and whenever the app returns to foreground (e.g. user enabled in Settings)
  useEffect(() => {
    const sync = () => {
      Notifications.getPermissionsAsync().then(({ status }) => {
        setNotificationsGranted(status === 'granted');
      });
    };

    sync();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') sync();
    });

    return () => subscription.remove();
  }, []);

  const readCount = async (): Promise<number> => {
    const raw = await AsyncStorage.getItem(AsyncStorageKeys.IMPULSE_PERMISSION_ASK_COUNT);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const incrementCount = async (): Promise<number> => {
    const current = await readCount();
    const next = current + 1;
    await AsyncStorage.setItem(AsyncStorageKeys.IMPULSE_PERMISSION_ASK_COUNT, String(next));
    return next;
  };

  const shouldAsk = (count: number): boolean => {
    if (count > IMPULSE_PERMISSION_MAX_ASK_COUNT) return false;
    return (IMPULSE_PERMISSION_ASK_THRESHOLDS as readonly number[]).includes(count);
  };

  /**
   * Call this when the impulse toggle is flipped ON.
   *
   * 1. Increments the activation count.
   * 2. On threshold counts (1st, 3rd, 10th), requests notification permissions via useNotificationPermissions.
   * 3. Otherwise re-checks current status (user may have changed in system settings).
   * 4. Returns the resolved granted status so the caller can set mode at toggle time.
   */
  const onImpulseToggleActivated = async (): Promise<boolean> => {
    const newCount = await incrementCount();

    const granted = shouldAsk(newCount) ? await requestPermissions() : await checkPermissions();

    setNotificationsGranted(granted);
    return granted;
  };

  return {
    notificationsGranted,
    onImpulseToggleActivated,
  };
};
