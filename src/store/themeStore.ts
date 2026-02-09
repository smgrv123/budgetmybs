import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ThemePreference, type ThemePreferenceType } from '@/src/types';

type ThemeState = {
  themePreference: ThemePreferenceType;
  hasHydrated: boolean;
  setThemePreference: (preference: ThemePreferenceType) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: ThemePreference.SYSTEM,
      hasHydrated: false,
      setThemePreference: (preference) => set({ themePreference: preference }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
