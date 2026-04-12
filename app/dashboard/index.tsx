import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CreditCardTxnTypeEnum, RecurringSourceTypeEnum } from '@/db/types';
import {
  AddTransactionModal,
  BButton,
  BCard,
  BIcon,
  BLink,
  BModal,
  BSafeAreaView,
  BText,
  BToast,
  BView,
  ExtraIncomeSection,
  IncomeForm,
  QuickActionsSection,
  QuickStatSheet,
} from '@/src/components';
import { CreditCardPreviewCard } from '@/src/components/credit-cards';
import DashboardHeroCard from '@/src/components/dashboard/heroCard';
import { TransactionCard } from '@/src/components/transaction';
import {
  CREDIT_CARD_DATE_FORMATS,
  CREDIT_CARD_PROVIDER_COLORS,
  CREDIT_CARD_PROVIDER_ICONS,
  CREDIT_CARD_PROVIDER_OPTIONS,
} from '@/src/constants/credit-cards.config';
import { createQuickStats, createStatCards, QuickStatType } from '@/src/constants/dashboardData';
import { INCOME_FORM_STRINGS } from '@/src/constants/income.strings';
import { BUDGET_ALERT_STRINGS } from '@/src/constants/notifications.strings';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant, ToastVariant } from '@/src/constants/theme';
import {
  useCreditCards,
  useDebts,
  useExpenses,
  useFixedExpenses,
  useIncome,
  useMonthlyBudget,
  useProfile,
  useRecurringStatus,
  useSavingsGoals,
  useSplitwise,
  useSplitwiseSync,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { QuickStatTypeValue } from '@/src/types/dashboard';
import { calculateTotalEMI, calculateTotalFixedExpenses } from '@/src/utils/budget';
import { mapDebtToSheet, mapFixedExpenseToSheet, mapSavingsGoalToSheet } from '@/src/utils/dashboard';
import { formatDate } from '@/src/utils/date';
import { computeFrivolousBudgetAlert } from '@/src/utils/notificationUtils';

export default function DashboardScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { profile, isProfileLoading, isProfileError, refetchProfile } = useProfile();
  const { fixedExpenses, isFixedExpensesLoading } = useFixedExpenses();
  const { debts, isDebtsLoading } = useDebts();
  const { savingsGoals, isSavingsGoalsLoading } = useSavingsGoals();
  const { expenses, totalSpent, totalSaved: totalOneOffSavings, oneOffSavings } = useExpenses();
  const { income } = useIncome();
  const { creditCards, creditCardSummaries } = useCreditCards();
  const { isItemProcessed } = useRecurringStatus();
  const { snapshot, rollover, additionalIncome, resetRollover, isResettingRollover } = useMonthlyBudget();
  const { isConnected: isSplitwiseConnected } = useSplitwise();
  const { triggerStaleGatedSync } = useSplitwiseSync();

  // Auto-sync Splitwise on mount (or when connection state changes) if connected and stale
  useEffect(() => {
    if (isSplitwiseConnected) {
      triggerStaleGatedSync();
    }
    // triggerStaleGatedSync is stable (no useCallback needed — React Compiler memoizes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSplitwiseConnected]);

  // Gradient colors (theme-aware)
  const HEADER_GRADIENT: [string, string, string] = [
    themeColors.confirmationGradientStart,
    themeColors.confirmationGradientMiddle,
    themeColors.confirmationGradientEnd,
  ];

  // Budget alert session flags — reset when component unmounts (e.g. app restart)
  const has80Shown = useRef(false);
  const has100Shown = useRef(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<typeof ToastVariant.WARNING | typeof ToastVariant.ERROR>(
    ToastVariant.WARNING
  );

  const handleExpenseCreated = (amount: number) => {
    const totalFrivolousBudget =
      (snapshot?.frivolousBudget ?? 0) + (snapshot?.rolloverFromPrevious ?? 0) + additionalIncome;
    const newTotalSpent = totalSpent + amount;
    const alert = computeFrivolousBudgetAlert(newTotalSpent, totalFrivolousBudget);

    if (alert === 'error' && !has100Shown.current) {
      has100Shown.current = true;
      setToastMessage(BUDGET_ALERT_STRINGS.error.message);
      setToastVariant(ToastVariant.ERROR);
      setToastVisible(true);
    } else if (alert === 'warning' && !has80Shown.current) {
      has80Shown.current = true;
      setToastMessage(BUDGET_ALERT_STRINGS.warning.message);
      setToastVariant(ToastVariant.WARNING);
      setToastVisible(true);
    }
  };

  // Modal states
  const [isAddTransactionModalVisible, setIsAddTransactionModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [quickStatSheetVisible, setQuickStatSheetVisible] = useState(false);
  const [selectedQuickStat, setSelectedQuickStat] = useState<QuickStatTypeValue | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const isLoading = isProfileLoading || isFixedExpensesLoading || isDebtsLoading || isSavingsGoalsLoading;

  // Calculate totals using existing utility functions
  const totalFixedExpenses = calculateTotalFixedExpenses(fixedExpenses ?? []);
  const totalEMI = calculateTotalEMI(debts ?? []);
  const monthlyIncome = profile?.salary ?? 0;
  const totalMonthlySavings = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Real spending data from DB
  const spentThisMonth = totalSpent;
  const savedThisMonth = totalOneOffSavings + totalMonthlySavings;

  // Calculate budget remaining
  const totalCommitments = savedThisMonth + spentThisMonth;
  const effectiveBudget = monthlyIncome + rollover + additionalIncome;
  const budgetRemaining = effectiveBudget - totalCommitments;
  const budgetUsedPercent = effectiveBudget > 0 ? Math.round((totalCommitments / effectiveBudget) * 100) : 0;
  const carouselCardWidth = Math.max(0, screenWidth - Spacing.lg * 2);
  const carouselSnapInterval = carouselCardWidth + Spacing.md;
  const carouselItemCount = 1 + creditCards.length;

  // Create stat cards and quick stats using helper functions
  const statCards = createStatCards(spentThisMonth, savedThisMonth, themeColors);
  const quickStats = createQuickStats(
    totalFixedExpenses,
    fixedExpenses?.length ?? 0,
    totalEMI,
    debts?.length ?? 0,
    totalMonthlySavings,
    savingsGoals.length,
    themeColors
  );

  // Helper function to get sheet title based on quick stat type
  const getSheetTitle = (statType: QuickStatTypeValue | null): string => {
    switch (statType) {
      case QuickStatType.FIXED:
        return 'Fixed Expenses';
      case QuickStatType.EMIS:
        return 'EMI Payments';
      case QuickStatType.GOALS:
        return 'Monthly Savings';
      default:
        return 'Goals';
    }
  };

  // Handle quick stat press - now supporting separate completed/incomplete sheets
  const handleQuickStatPress = (statId: QuickStatTypeValue) => {
    setSelectedQuickStat(statId);
    setQuickStatSheetVisible(true);
  };

  const handleResetRollover = () => {
    Alert.alert('Reset Rollover', 'This will remove the carried-over budget from last month. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetRollover() },
    ]);
  };

  const summaryById = useMemo(() => {
    return new Map(creditCardSummaries.map((summary) => [summary.cardId, summary]));
  }, [creditCardSummaries]);

  const providerLabels = useMemo(() => {
    return new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));
  }, []);

  const handleCardScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (!carouselSnapInterval) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselSnapInterval);
    setActiveCardIndex(nextIndex);
  };

  if (isLoading) {
    return (
      <BSafeAreaView edges={['top']}>
        <BView flex center>
          <BIcon name="sync" color={themeColors.primary} size="lg" />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            Loading your dashboard...
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (isProfileError) {
    return (
      <BSafeAreaView edges={['top']}>
        <BView flex center padding={SpacingValue.XL}>
          <BIcon name="alert-circle-outline" color={themeColors.error} size="lg" />
          <BText variant={TextVariant.SUBHEADING} center style={{ marginTop: Spacing.md }}>
            Something went wrong
          </BText>
          <BText variant={TextVariant.CAPTION} muted center style={{ marginTop: Spacing.xs }}>
            We couldn&apos;t load your data. Please try again.
          </BText>
          <BView marginY="xl">
            <BButton onPress={() => refetchProfile()} paddingX="xl" paddingY="md" rounded="lg">
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                Retry
              </BText>
            </BButton>
          </BView>
        </BView>
      </BSafeAreaView>
    );
  }
  // ! this should be removed. single query should be triggered for this. again to be picked in a revamp. let go for now
  const combinedTransactions = [...expenses, ...oneOffSavings];

  const dashboardSections = [
    {
      key: 'header',
      rank: 0,
      enabled: true,
      component: (
        <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <BView paddingY={SpacingValue.MD}>
            <BText variant={TextVariant.BODY} color={themeColors.white} muted style={{ marginBottom: Spacing.xs }}>
              {formatDate()}
            </BText>
            <BText variant={TextVariant.HEADING} color={themeColors.white}>
              Hey, {profile?.name}!
            </BText>
          </BView>
        </LinearGradient>
      ),
    },
    {
      key: 'carousel',
      rank: 1,
      enabled: true,
      component: (
        <BView style={styles.budgetCardWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={carouselSnapInterval}
            decelerationRate="fast"
            onScroll={handleCardScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
          >
            <DashboardHeroCard
              carouselCardWidth={carouselCardWidth}
              rollover={rollover}
              additionalIncome={additionalIncome}
              handleResetRollover={handleResetRollover}
              isResettingRollover={isResettingRollover}
              budgetRemaining={budgetRemaining}
              budgetUsedPercent={budgetUsedPercent}
              carouselLength={Boolean(creditCards.length)}
            />

            {creditCards.map((card, index) => {
              const summary = summaryById.get(card.id);
              const providerLabel =
                providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
              const dueDateLabel = summary?.dueDate
                ? formatDate(summary.dueDate, CREDIT_CARD_DATE_FORMATS.dueDate)
                : CREDIT_CARDS_SETTINGS_STRINGS.preview.dueFallback;

              return (
                <BButton
                  key={card.id}
                  variant={ButtonVariant.GHOST}
                  padding={SpacingValue.NONE}
                  onPress={() => router.push(`/credit-cards/${card.id}`)}
                  style={{
                    width: carouselCardWidth,
                    marginRight: index === creditCards.length - 1 ? 0 : Spacing.md,
                  }}
                >
                  <CreditCardPreviewCard
                    nickname={card.nickname}
                    bank={card.bank}
                    providerLabel={providerLabel}
                    providerIcon={CREDIT_CARD_PROVIDER_ICONS[card.provider]}
                    last4={card.last4}
                    usedAmount={summary?.usedAmount ?? 0}
                    creditLimit={summary?.creditLimit ?? card.creditLimit}
                    dueDateLabel={dueDateLabel}
                  />
                </BButton>
              );
            })}
          </ScrollView>

          {carouselItemCount > 1 && (
            <BView row center gap={SpacingValue.XS} style={{ marginTop: Spacing.sm }}>
              {Array.from({ length: carouselItemCount }).map((_, index) => (
                <View
                  key={`carousel-dot-${index}`}
                  style={[
                    styles.carouselDot,
                    { backgroundColor: index === activeCardIndex ? themeColors.primary : themeColors.border },
                  ]}
                />
              ))}
            </BView>
          )}
        </BView>
      ),
    },
    {
      key: 'stat-cards',
      rank: 2,
      enabled: true,
      component: (
        <BView row gap={SpacingValue.MD} paddingX={SpacingValue.LG} marginY={SpacingValue.MD}>
          {statCards.map((item) => (
            <BCard key={item.id} variant="default" style={{ flex: 1, padding: Spacing.md }}>
              <BView flex>
                <BText variant={TextVariant.CAPTION} muted>
                  {item.label}
                </BText>
                <BText variant={TextVariant.SUBHEADING} style={{ color: item.color }}>
                  {item.value}
                </BText>
              </BView>
            </BCard>
          ))}
        </BView>
      ),
    },
    {
      key: 'quick-actions',
      rank: 3,
      enabled: true,
      component: (
        <QuickActionsSection
          onLogTransactionPress={() => setIsAddTransactionModalVisible(true)}
          onLogIncomePress={() => setIsIncomeModalVisible(true)}
          onManageSavingsPress={() => router.push('/savings')}
        />
      ),
    },
    {
      key: 'quick-stats',
      rank: 4,
      enabled: true,
      component: (
        <BView paddingX={SpacingValue.LG} marginY={SpacingValue.SM}>
          <BText variant={TextVariant.SUBHEADING} style={{ marginBottom: Spacing.md }}>
            Quick Stats
          </BText>
          <BView row justify="space-between" style={{ flexWrap: 'wrap' }}>
            {quickStats.map((item) => (
              <BButton
                key={item.id}
                variant={ButtonVariant.GHOST}
                onPress={() => handleQuickStatPress(item.id)}
                disabled={item.count === 0}
                style={[
                  item.count === 0 && styles.quickStatCardDisabled,
                  styles.statsCards,
                  { shadowColor: themeColors.text, width: `${Math.floor(96 / quickStats.length)}%` as any },
                ]}
              >
                <BCard variant="default" style={{ padding: Spacing.md, width: '100%' }}>
                  <BView center flex>
                    <BIcon name={item.icon as any} color={item.color} size="md" />
                    <BText variant={TextVariant.LABEL} style={{ marginTop: Spacing.xs }}>
                      {item.value}
                    </BText>
                    <BText variant={TextVariant.CAPTION} muted>
                      {item.label}
                    </BText>
                  </BView>
                </BCard>
              </BButton>
            ))}
          </BView>
        </BView>
      ),
    },
    {
      key: 'extra-income',
      rank: 5,
      enabled: income.length > 0,
      component: <ExtraIncomeSection incomeEntries={income} />,
    },
    {
      key: 'recent-transactions',
      rank: 6,
      enabled: true,
      component: (
        <BView paddingX={SpacingValue.LG} marginY={SpacingValue.LG}>
          <BView row justify="space-between" align="center" style={{ marginBottom: Spacing.md }}>
            <BText variant={TextVariant.SUBHEADING}>Recent Transactions</BText>
            <BLink href="/all-transactions">
              <BText variant={TextVariant.CAPTION} style={{ color: themeColors.primary }}>
                See All
              </BText>
            </BLink>
          </BView>
          {combinedTransactions.length === 0 ? (
            <BView center paddingY={SpacingValue.XL}>
              <BIcon name="receipt-outline" size="lg" color={themeColors.textMuted} />
              <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
                No transactions yet
              </BText>
              <BText variant={TextVariant.CAPTION} muted>
                Tap the + button to add your first expense
              </BText>
            </BView>
          ) : (
            combinedTransactions.map((item, index) => {
              // ! accept for now, should be picked up in the revamp
              const creditCardColor =
                'creditCard' in item && item.creditCard
                  ? CREDIT_CARD_PROVIDER_COLORS[item.creditCard.provider]
                  : undefined;
              return (
                <BView key={item.id}>
                  {index > 0 && <BView style={{ height: Spacing.xxs }} />}
                  <BLink href={`/transaction-detail?id=${item.id}`} fullWidth style={{ paddingVertical: 0 }}>
                    <TransactionCard
                      id={item.id}
                      description={item.description}
                      amount={item.amount}
                      date={item.date}
                      categoryName={'category' in item ? item.category?.name : null}
                      categoryIcon={'category' in item ? item.category?.icon : null}
                      categoryColor={'category' in item ? item.category?.color : null}
                      savingsType={'savingsType' in item ? item.savingsType : null}
                      isSaving={'isSaving' in item ? Boolean(item.isSaving) : false}
                      isRecurring={'sourceType' in item ? Boolean(item.sourceType) : false}
                      creditCardNickname={'creditCard' in item ? (item.creditCard?.nickname ?? null) : null}
                      creditCardLast4={'creditCard' in item ? (item.creditCard?.last4 ?? null) : null}
                      creditCardColor={creditCardColor ?? null}
                      isBillPay={
                        'creditCardTxnType' in item ? item.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT : false
                      }
                      isFromSplitwise={'isFromSplitwise' in item ? Boolean(item.isFromSplitwise) : false}
                    />
                  </BLink>
                </BView>
              );
            })
          )}
        </BView>
      ),
    },
  ];

  return (
    <BSafeAreaView edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {dashboardSections
          .filter((s) => s.enabled)
          .sort((a, b) => a.rank - b.rank)
          .map(({ key, component }) => (
            <BView key={key}>{component}</BView>
          ))}
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={isAddTransactionModalVisible}
        onClose={() => setIsAddTransactionModalVisible(false)}
        onExpenseCreated={handleExpenseCreated}
      />

      {/* Log Income Modal */}
      <BModal
        isVisible={isIncomeModalVisible}
        onClose={() => setIsIncomeModalVisible(false)}
        title={INCOME_FORM_STRINGS.modalTitle}
        position="bottom"
      >
        <IncomeForm onSuccess={() => setIsIncomeModalVisible(false)} />
      </BModal>

      {/* Budget threshold toast */}
      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Quick Stat Sheet */}
      <QuickStatSheet
        isVisible={quickStatSheetVisible}
        onClose={() => setQuickStatSheetVisible(false)}
        type={selectedQuickStat ?? QuickStatType.FIXED}
        title={getSheetTitle(selectedQuickStat)}
        fixedExpenses={fixedExpenses?.map((fe) =>
          mapFixedExpenseToSheet(fe, isItemProcessed(RecurringSourceTypeEnum.FIXED_EXPENSE, fe.id))
        )}
        debts={debts?.map((d) => mapDebtToSheet(d, isItemProcessed(RecurringSourceTypeEnum.DEBT_EMI, d.id)))}
        savingsGoals={savingsGoals?.map(mapSavingsGoalToSheet)}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  budgetCardWrapper: {
    marginTop: -Spacing['2xl'],
  },

  statsCards: {
    width: '48%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  quickStatCardDisabled: {
    opacity: 0.5,
  },
  carouselDot: {
    width: Spacing.xs,
    height: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
