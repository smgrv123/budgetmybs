import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeStore } from '@/src/store/themeStore';
import { ColorScheme, ThemePreference, type ColorSchemeType } from '@/src/types';

/**
 * Hook for theme management using Zustand store
 * Provides instant reactivity across all components
 */
export const useTheme = () => {
  const deviceColorScheme = useRNColorScheme();
  const { themePreference, setThemePreference, hasHydrated } = useThemeStore();

  // Resolve color scheme based on preference
  let colorScheme: ColorSchemeType | null = null;

  if (hasHydrated) {
    if (themePreference === ThemePreference.SYSTEM) {
      colorScheme = deviceColorScheme === ColorScheme.DARK ? ColorScheme.DARK : ColorScheme.LIGHT;
    } else {
      colorScheme = themePreference === ThemePreference.DARK ? ColorScheme.DARK : ColorScheme.LIGHT;
    }
  }

  return {
    // Resolved theme
    colorScheme,
    isThemeLoading: !hasHydrated,

    // User preference
    themePreference,
    setThemePreference,
  };
};
