import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/db';
import { useTheme } from '@/src/hooks/theme-hooks/use-color-scheme';
import { registerImpulseNotificationCategory } from '@/src/services/notificationService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const unstable_settings = {
  anchor: 'index',
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const { colorScheme } = useTheme();

  useEffect(() => {
    registerImpulseNotificationCategory().catch((error) => {
      console.error('Failed to register impulse notification category:', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="credit-cards/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="transaction-detail" options={{ headerShown: false }} />
              <Stack.Screen name="all-transactions" options={{ headerShown: false }} />
              <Stack.Screen name="all-income" options={{ headerShown: false }} />
              <Stack.Screen name="income-detail" options={{ headerShown: false }} />
              <Stack.Screen name="savings" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </QueryClientProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
