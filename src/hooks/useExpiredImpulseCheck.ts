import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getExpiredImpulsePurchases } from '@/src/utils/impulseAsyncStore';

/**
 * Runs on app open. If any expired impulse purchases are pending,
 * navigates to the impulse-confirm screen in list mode.
 */
export const useExpiredImpulseCheck = () => {
  const router = useRouter();

  useEffect(() => {
    const checkExpired = async () => {
      const expired = await getExpiredImpulsePurchases();
      if (expired.length > 0) {
        router.push('/impulse-confirm');
      }
    };

    checkExpired();
  }, [router]);
};
