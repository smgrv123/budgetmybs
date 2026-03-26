import { Tabs } from 'expo-router';

import { BIcon } from '@/src/components/ui';
import type { BIconProps } from '@/src/components/ui/icon';
import { BorderRadius, IconSize } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useNotificationPermissions, useNotificationScheduler } from '@/src/hooks';

function TabIcon({ name, color }: { name: BIconProps['name']; color: string }) {
  return <BIcon name={name} size={IconSize.base} color={color} />;
}

export default function DashboardLayout() {
  const themeColors = useThemeColors();
  useNotificationPermissions();
  useNotificationScheduler();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarActiveBackgroundColor: themeColors.primaryFaded,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
