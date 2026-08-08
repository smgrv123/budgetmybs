import { Image, ScrollView, StyleSheet } from 'react-native';

import { BCard, BIcon, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components';
import { SettlementButton } from '@/src/components/splitwise';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
import { BorderRadius, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitwiseBalances } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

export default function SplitwiseBalancesScreen() {
  const themeColors = useThemeColors();
  const { friendBalances, isFriendBalancesLoading } = useSplitwiseBalances();

  return (
    <BSafeAreaView edges={['top']}>
      <BView paddingX={SpacingValue.XS}>
        <ScreenHeader title={SPLITWISE_BALANCES_STRINGS.screenTitle} titleVariant={TextVariant.SUBHEADING} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <BView paddingX={SpacingValue.MD} gap={SpacingValue.MD}>
            {isFriendBalancesLoading ? (
              <BView flex center paddingY={SpacingValue['2XL']}>
                <BIcon name="sync" color={themeColors.primary} size="lg" />
              </BView>
            ) : friendBalances.length === 0 ? (
              <BView center paddingY={SpacingValue['2XL']}>
                <BIcon name="checkmark-circle-outline" color={themeColors.success} size="lg" />
                <BText variant={TextVariant.SUBHEADING} center style={{ marginTop: Spacing.md }}>
                  {SPLITWISE_BALANCES_STRINGS.friendsListEmpty}
                </BText>
                <BText variant={TextVariant.CAPTION} muted center style={{ marginTop: Spacing.xs }}>
                  {SPLITWISE_BALANCES_STRINGS.friendsListEmptySubtitle}
                </BText>
              </BView>
            ) : (
              friendBalances.map((friend) => {
                const friendUserIdNum = parseInt(friend.paidByUserId, 10);
                const settlementAmount = Math.abs(friend.netAmount);
                const mode = friend.netAmount >= 0 ? 'mark-received' : 'settle-up';
                return (
                  <BCard key={friend.paidByUserId}>
                    <BView gap={SpacingValue.SM}>
                      <BView row align="center" justify="space-between">
                        <BView row align="center" gap={SpacingValue.SM}>
                          <BView
                            style={[
                              styles.avatar,
                              {
                                backgroundColor:
                                  friend.netAmount >= 0 ? themeColors.successBackground : themeColors.errorBackground,
                              },
                            ]}
                          >
                            {friend.avatarUrl ? (
                              <Image source={{ uri: friend.avatarUrl }} style={styles.avatarImage} />
                            ) : (
                              <BIcon
                                name="person-outline"
                                color={friend.netAmount >= 0 ? themeColors.success : themeColors.error}
                                size="sm"
                              />
                            )}
                          </BView>
                          <BView>
                            <BText variant={TextVariant.LABEL}>{friend.displayName}</BText>
                            <BText variant={TextVariant.CAPTION} muted>
                              {friend.netAmount >= 0
                                ? SPLITWISE_BALANCES_STRINGS.owedByLabel
                                : SPLITWISE_BALANCES_STRINGS.youOweThemLabel}
                            </BText>
                          </BView>
                        </BView>
                        <BText
                          variant={TextVariant.LABEL}
                          style={{ color: friend.netAmount >= 0 ? themeColors.success : themeColors.error }}
                        >
                          {formatCurrency(settlementAmount)}
                        </BText>
                      </BView>

                      {!Number.isNaN(friendUserIdNum) && settlementAmount > 0 && (
                        <SettlementButton
                          mode={mode}
                          friendName={friend.displayName}
                          amount={settlementAmount}
                          friendUserId={friendUserIdNum}
                        />
                      )}
                    </BView>
                  </BCard>
                );
              })
            )}
          </BView>
        </ScrollView>
      </BView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: Spacing['2xl'],
    height: Spacing['2xl'],
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: Spacing['2xl'],
    height: Spacing['2xl'],
    borderRadius: BorderRadius.full,
  },
});
