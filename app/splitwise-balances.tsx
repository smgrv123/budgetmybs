import { BIcon, BSafeAreaView, BText, BView } from '@/src/components/ui';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitwiseBalances } from '@/src/hooks/useSplitwiseBalances';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FriendBalance } from '@/src/services/splitwiseBalances';
import { formatCurrency } from '@/src/utils/format';
import { Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet } from 'react-native';

export default function SplitwiseBalancesScreen() {
  const themeColors = useThemeColors();
  const { totalOwed, totalOwing, friends, isLoading } = useSplitwiseBalances();

  const renderHeader = () => (
    <BView
      row
      justify="space-between"
      paddingX={SpacingValue.LG}
      paddingY={SpacingValue.MD}
      style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border }}
    >
      <BView>
        <BText variant={TextVariant.CAPTION} muted>
          You are owed
        </BText>
        <BText variant={TextVariant.SUBHEADING} style={{ color: themeColors.success }}>
          {formatCurrency(totalOwed)}
        </BText>
      </BView>
      <BView align="flex-end">
        <BText variant={TextVariant.CAPTION} muted>
          You owe
        </BText>
        <BText variant={TextVariant.SUBHEADING} style={{ color: themeColors.error }}>
          {formatCurrency(totalOwing)}
        </BText>
      </BView>
    </BView>
  );

  const renderItem = ({ item }: { item: FriendBalance }) => {
    const isPositive = item.inrBalance > 0;
    const balanceColor = isPositive ? themeColors.success : themeColors.error;
    const balancePrefix = isPositive ? '+' : '-';
    const initials = item.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <BView
        row
        align="center"
        justify="space-between"
        paddingX={SpacingValue.LG}
        paddingY={SpacingValue.MD}
        style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border }}
      >
        <BView row align="center" gap={SpacingValue.MD}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <BView center rounded="full" style={[styles.avatar, { backgroundColor: themeColors.muted }]}>
              <BText variant={TextVariant.CAPTION} style={{ color: themeColors.textMuted }}>
                {initials}
              </BText>
            </BView>
          )}
          <BText variant={TextVariant.LABEL}>{item.name}</BText>
        </BView>
        <BText variant={TextVariant.LABEL} style={{ color: balanceColor }}>
          {balancePrefix}
          {formatCurrency(Math.abs(item.inrBalance))}
        </BText>
      </BView>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <BView flex center paddingY={SpacingValue.XL}>
        <BIcon name="checkmark-circle-outline" size="lg" color={themeColors.success} />
        <BText variant={TextVariant.BODY} style={{ marginTop: Spacing.md }}>
          All settled up!
        </BText>
        <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
          No outstanding balances with friends
        </BText>
      </BView>
    );
  };

  return (
    <BSafeAreaView edges={['top']}>
      <Stack.Screen options={{ title: 'Split Balances', headerShown: true }} />

      {isLoading ? (
        <BView flex center>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </BView>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={friends.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={friends.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
  },
});
