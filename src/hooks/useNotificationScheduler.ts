import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { scheduleAllNotifications } from '@/src/services/notificationService';
import { useCreditCards } from './useCreditCards';
import { useDebts } from './useDebts';
import { useFixedExpenses } from './useFixedExpenses';

/**
 * Watches fixed expenses, debts, and credit cards query data and reschedules
 * all notifications whenever any data changes. Mounted once at dashboard layout
 * level — covers both app open and in-session mutations (via TanStack Query invalidation).
 */
export const useNotificationScheduler = () => {
  const { fixedExpenses } = useFixedExpenses();
  const { debts } = useDebts();
  const { creditCards } = useCreditCards();

  useEffect(() => {
    const schedule = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      await scheduleAllNotifications({ fixedExpenses, debts, creditCards });
    };

    schedule();
  }, [fixedExpenses, debts, creditCards]);
};
