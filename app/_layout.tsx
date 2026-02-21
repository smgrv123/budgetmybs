import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/db';
import { useTheme } from '@/src/hooks/theme-hooks/use-color-scheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const unstable_settings = {
  anchor: 'index',
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const { colorScheme } = useTheme();

  return (
    <DatabaseProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </DatabaseProvider>
  );
}
