import { Colors } from '@/src/constants/theme';
import { useTheme } from './use-color-scheme';

/**
 * Hook to get theme-aware colors based on the current color scheme.
 * This is a simple wrapper that returns Colors.light or Colors.dark
 * based on the current theme preference.
 */
export function useThemeColors() {
  const { colorScheme } = useTheme();
  return Colors[colorScheme ?? 'light'];
}

/**
 * Type representing the theme color palette.
 * Use this type when passing theme colors as function parameters.
 */
export type ThemeColors = ReturnType<typeof useThemeColors>;
