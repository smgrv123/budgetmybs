import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="fixed-expenses" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="savings" />
    </Stack>
  );
}
