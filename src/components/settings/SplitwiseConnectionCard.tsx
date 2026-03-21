import { BButton, BIcon, BText, BView } from '@/src/components/ui';
import { SpacingValue } from '@/src/constants/theme';
import { useSplitwise } from '@/src/hooks/useSplitwise';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { Alert, Image, ActivityIndicator } from 'react-native';

export default function SplitwiseConnectionCard() {
  const themeColors = useThemeColors();
  const { isConnected, user, isLoading, connect, isConnecting, disconnect, isDisconnecting } = useSplitwise();

  const handleDisconnect = () => {
    Alert.alert('Disconnect Splitwise', 'Are you sure you want to disconnect your Splitwise account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
    ]);
  };

  if (isLoading) {
    return (
      <BView row align="center" justify="space-between" paddingY={SpacingValue.XS}>
        <BView row align="center" gap="md">
          <BView center rounded="base" bg={themeColors.muted} padding="sm" style={{ width: 36, height: 36 }}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </BView>
          <BText variant="label">Splitwise</BText>
        </BView>
      </BView>
    );
  }

  if (isConnected && user) {
    return (
      <BView row align="center" justify="space-between" paddingY={SpacingValue.XS}>
        <BView row align="center" gap="md">
          {/* Avatar or initials */}
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <BView center rounded="full" bg={themeColors.primary} style={{ width: 36, height: 36 }}>
              <BText variant="caption" color={themeColors.white}>
                {user.name.charAt(0).toUpperCase()}
              </BText>
            </BView>
          )}

          <BView>
            <BText variant="label">{user.name}</BText>
            <BView row align="center" gap="xs">
              <BView
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: themeColors.success ?? '#22c55e',
                }}
              />
              <BText variant="caption" color={themeColors.success ?? '#22c55e'}>
                Connected
              </BText>
            </BView>
          </BView>
        </BView>

        <BButton variant="ghost" onPress={handleDisconnect} disabled={isDisconnecting} paddingY="xs" paddingX="sm">
          <BText variant="caption" color={themeColors.danger ?? themeColors.textMuted}>
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
          </BText>
        </BButton>
      </BView>
    );
  }

  // Disconnected state
  return (
    <BView row align="center" justify="space-between" paddingY={SpacingValue.XS}>
      <BView row align="center" gap="md">
        <BView center rounded="base" bg={themeColors.muted} padding="sm" style={{ width: 36, height: 36 }}>
          <BIcon name="people-outline" size="sm" color={themeColors.textMuted} />
        </BView>
        <BView>
          <BText variant="label">Splitwise</BText>
          <BText variant="caption" muted>
            Split expenses with friends
          </BText>
        </BView>
      </BView>

      <BButton variant="outline" onPress={() => connect()} disabled={isConnecting} paddingY="xs" paddingX="sm">
        {isConnecting ? (
          <ActivityIndicator size="small" color={themeColors.primary} />
        ) : (
          <BText variant="caption" color={themeColors.primary}>
            Connect
          </BText>
        )}
      </BButton>
    </BView>
  );
}
