import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet } from 'react-native';

import { createExpense } from '@/db/queries/expenses';
import { BButton, BCard, BIcon, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { IMPULSE_NOTIFICATION_ID_PREFIX } from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { ButtonVariant, CardVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { PendingImpulsePurchase } from '@/src/types/impulse';
import { getExpiredImpulsePurchases, getAllImpulsePurchases, removeImpulsePurchase } from '@/src/utils/impulseAsyncStore';
import { formatCurrency } from '@/src/utils/format';
import dayjs from 'dayjs';

export default function ImpulseConfirmScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const themeColors = useThemeColors();

  const [items, setItems] = useState<PendingImpulsePurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const isSingleMode = Boolean(id);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        if (isSingleMode && id) {
          const all = await getAllImpulsePurchases();
          const found = all.find((entry) => entry.id === id);
          setItems(found ? [found] : []);
        } else {
          const expired = await getExpiredImpulsePurchases();
          setItems(expired);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [id, isSingleMode]);

  const cancelNotificationIfPresent = async (notificationId: string | null) => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  };

  const handleConfirm = async (entry: PendingImpulsePurchase) => {
    setProcessingIds((prev) => new Set(prev).add(entry.id));
    try {
      await createExpense({
        amount: entry.purchaseData.amount,
        categoryId: entry.purchaseData.categoryId,
        description: entry.purchaseData.description,
        creditCardId: entry.purchaseData.creditCardId,
        date: entry.purchaseData.date,
        wasImpulse: 1,
      });
      await removeImpulsePurchase(entry.id);
      await cancelNotificationIfPresent(
        entry.notificationId
          ? entry.notificationId
          : `${IMPULSE_NOTIFICATION_ID_PREFIX}${entry.id}`
      );

      const remaining = items.filter((item) => item.id !== entry.id);
      setItems(remaining);

      if (remaining.length === 0) {
        router.back();
      }
    } catch (error) {
      console.error(IMPULSE_STRINGS.confirmErrorLog, error);
      Alert.alert('Error', 'Failed to confirm purchase. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  const handleSkip = async (entry: PendingImpulsePurchase) => {
    setProcessingIds((prev) => new Set(prev).add(entry.id));
    try {
      await removeImpulsePurchase(entry.id);
      await cancelNotificationIfPresent(
        entry.notificationId
          ? entry.notificationId
          : `${IMPULSE_NOTIFICATION_ID_PREFIX}${entry.id}`
      );

      const remaining = items.filter((item) => item.id !== entry.id);
      setItems(remaining);

      if (remaining.length === 0) {
        router.back();
      }
    } catch (error) {
      console.error(IMPULSE_STRINGS.skipErrorLog, error);
      Alert.alert('Error', 'Failed to skip purchase. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  // Skip all remaining items and navigate back (used by header back + Android hardware back)
  const handleBackPress = async () => {
    for (const entry of items) {
      try {
        await removeImpulsePurchase(entry.id);
        await cancelNotificationIfPresent(
          entry.notificationId ?? `${IMPULSE_NOTIFICATION_ID_PREFIX}${entry.id}`
        );
      } catch (error) {
        console.error(IMPULSE_STRINGS.skipErrorLog, error);
      }
    }
    router.back();
  };

  // Intercept Android hardware back button.
  // Logic is intentionally inlined (duplicating handleBackPress) rather than calling it directly,
  // because handleBackPress is not memoized (project bans useCallback) and including it in the
  // dep array would cause the BackHandler to re-register on every render.
  // items + router are the true stable dependencies here.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const skipAll = async () => {
        for (const entry of items) {
          try {
            await removeImpulsePurchase(entry.id);
            await cancelNotificationIfPresent(
              entry.notificationId ?? `${IMPULSE_NOTIFICATION_ID_PREFIX}${entry.id}`
            );
          } catch (error) {
            console.error(IMPULSE_STRINGS.skipErrorLog, error);
          }
        }
        router.back();
      };
      skipAll();
      return true;
    });
    return () => subscription.remove();
  }, [items, router]);

  if (isLoading) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView paddingX={SpacingValue.LG}>
          <ScreenHeader title={IMPULSE_STRINGS.confirmScreenTitle} onBack={handleBackPress} />
        </BView>
        <BView flex center>
          <BIcon name="sync" size="lg" color={themeColors.primary} />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            {IMPULSE_STRINGS.loadingLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView paddingX={SpacingValue.LG}>
          <ScreenHeader title={IMPULSE_STRINGS.confirmScreenTitle} onBack={handleBackPress} />
        </BView>
        <BView flex center padding={SpacingValue.LG}>
          <BIcon name="checkmark-circle-outline" size="lg" color={themeColors.success} />
          <BText variant={TextVariant.SUBHEADING} style={{ marginTop: Spacing.md }}>
            {IMPULSE_STRINGS.confirmScreenEmptyTitle}
          </BText>
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.xs }}>
            {IMPULSE_STRINGS.confirmScreenEmptyBody}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader title={IMPULSE_STRINGS.confirmScreenTitle} />
      </BView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {items.map((entry) => {
          const isProcessing = processingIds.has(entry.id);
          return (
            <BCard key={entry.id} variant={CardVariant.ELEVATED} style={styles.card}>
              {/* Cooldown expired badge */}
              <BView
                row
                align="center"
                gap={SpacingValue.XS}
                paddingX={SpacingValue.SM}
                paddingY={SpacingValue.XXS}
                rounded="base"
                style={{
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  backgroundColor: themeColors.warningBackground,
                  borderColor: themeColors.warning,
                  marginBottom: Spacing.md,
                }}
              >
                <BIcon name="time-outline" size="sm" color={themeColors.warning} />
                <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
                  {IMPULSE_STRINGS.cooldownExpiredBadge}
                </BText>
              </BView>

              {/* Amount */}
              <BView style={{ marginBottom: Spacing.sm }}>
                <BText variant={TextVariant.CAPTION} muted>
                  {IMPULSE_STRINGS.amountLabel}
                </BText>
                <BText variant={TextVariant.HEADING} style={{ color: themeColors.error }}>
                  -{formatCurrency(entry.purchaseData.amount)}
                </BText>
              </BView>

              {/* Description */}
              <BView style={{ marginBottom: Spacing.sm }}>
                <BText variant={TextVariant.CAPTION} muted>
                  {IMPULSE_STRINGS.descriptionLabel}
                </BText>
                <BText variant={TextVariant.BODY}>
                  {entry.purchaseData.description ?? IMPULSE_STRINGS.noDescription}
                </BText>
              </BView>

              {/* Date */}
              <BView style={{ marginBottom: Spacing.lg }}>
                <BText variant={TextVariant.CAPTION} muted>
                  {IMPULSE_STRINGS.dateLabel}
                </BText>
                <BText variant={TextVariant.BODY}>
                  {dayjs(entry.purchaseData.date).format('DD MMM YYYY')}
                </BText>
              </BView>

              {/* Action Buttons */}
              <BView gap={SpacingValue.SM}>
                <BButton
                  variant={ButtonVariant.PRIMARY}
                  onPress={() => handleConfirm(entry)}
                  loading={isProcessing}
                  style={styles.fullWidthButton}
                  paddingY={SpacingValue.MD}
                >
                  <BText variant={TextVariant.LABEL} color={themeColors.white}>
                    {IMPULSE_STRINGS.confirmLabel}
                  </BText>
                </BButton>
                <BButton
                  variant={ButtonVariant.OUTLINE}
                  onPress={() => handleSkip(entry)}
                  loading={isProcessing}
                  style={styles.fullWidthButton}
                  paddingY={SpacingValue.MD}
                >
                  <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                    {IMPULSE_STRINGS.skipLabel}
                  </BText>
                </BButton>
              </BView>
            </BCard>
          );
        })}
      </ScrollView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  fullWidthButton: {
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
