import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RecurringSourceTypeEnum } from '@/db/types';
import {
  AddTransactionModal,
  BButton,
  BCard,
  BFAB,
  BIcon,
  BLink,
  BSafeAreaView,
  BText,
  BView,
  QuickStatSheet,
  SplitBalancesCard,
} from '@/src/components';
import { TransactionCard } from '@/src/components/transaction';
import { createQuickStats, createStatCards, QuickStatType } from '@/src/constants/dashboardData';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  useDebts,
  useExpenses,
  useFixedExpenses,
  useMonthlyBudget,
  useProfile,
  useRecurringStatus,
  useSavingsGoals,
  useSplitwiseBalances,
  useSplitwiseReceivables,
  useSplitwiseSync,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { QuickStatTypeValue } from '@/src/types/dashboard';
import { calculateTotalEMI, calculateTotalFixedExpenses } from '@/src/utils/budget';
import { mapDebtToSheet, mapFixedExpenseToSheet, mapSavingsGoalToSheet } from '@/src/utils/dashboard';
import { formatDate } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/format';

export default function DashboardScreen() {
  const themeColors = useThemeColors();
  const { profile, isProfileLoading, isProfileError, refetchProfile } = useProfile();
  const { fixedExpenses, isFixedExpensesLoading } = useFixedExpenses();
  const { debts, isDebtsLoading } = useDebts();
  const { savingsGoals, completedGoals, incompleteGoals, isSavingsGoalsLoading, markGoalAsCompleted } =
    useSavingsGoals();
  const { expenses, totalSpent, totalSaved: totalOneOffSavings, oneOffSavings } = useExpenses();
  const { isItemProcessed } = useRecurringStatus();
  const { rollover, resetRollover, isResettingRollover } = useMonthlyBudget();
  const { sync: syncSplitwise, isSyncing } = useSplitwiseSync();
  const { totalOwed, totalOwing, isLoading: isBalancesLoading } = useSplitwiseBalances();
  const { totalReceivables } = useSplitwiseReceivables();

  // Sync Splitwise expenses on every app open
  useEffect(() => {
    syncSplitwise();
  }, []);

  // Gradient colors (theme-aware)
  const HEADER_GRADIENT: [string, string, string] = [
    themeColors.confirmationGradientStart,
    themeColors.confirmationGradientMiddle,
    themeColors.confirmationGradientEnd,
  ];

  // Modal states
  const [isAddTransactionModalVisible, setIsAddTransactionModalVisible] = useState(false);
  const [quickStatSheetVisible, setQuickStatSheetVisible] = useState(false);
  const [selectedQuickStat, setSelectedQuickStat] = useState<QuickStatTypeValue | null>(null);

  const isLoading = isProfileLoading || isFixedExpensesLoading || isDebtsLoading || isSavingsGoalsLoading;

  // Calculate totals using existing utility functions
  const totalFixedExpenses = calculateTotalFixedExpenses(fixedExpenses ?? []);
  const totalEMI = calculateTotalEMI(debts ?? []);
  const monthlyIncome = profile?.salary ?? 0;
  const totalMonthlySavings = completedGoals.reduce((sum, s) => sum + s.targetAmount, 0);

  // Real spending data from DB
  const spentThisMonth = totalSpent + totalFixedExpenses + totalEMI;
  const savedThisMonth = totalOneOffSavings + totalMonthlySavings;

  // Calculate budget remaining
  const totalCommitments = savedThisMonth + spentThisMonth;
  const effectiveBudget = monthlyIncome + rollover;
  const budgetRemaining = effectiveBudget - totalCommitments;
  const budgetUsedPercent = effectiveBudget > 0 ? Math.round((totalCommitments / effectiveBudget) * 100) : 0;
  const receivablesPercent = effectiveBudget > 0 ? Math.round((totalReceivables / effectiveBudget) * 100) : 0;
  const clampedReceivablesPercent = Math.min(receivablesPercent, Math.max(0, 100 - budgetUsedPercent));

  // Create stat cards and quick stats using helper functions
  const statCards = createStatCards(spentThisMonth, savedThisMonth, themeColors);
  const quickStats = createQuickStats(
    totalFixedExpenses,
    fixedExpenses?.length ?? 0,
    totalEMI,
    debts?.length ?? 0,
    completedGoals?.length ?? 0,
    incompleteGoals?.length ?? 0,
    themeColors
  );

  // Helper function to get sheet title based on quick stat type
  const getSheetTitle = (statType: QuickStatTypeValue | null): string => {
    switch (statType) {
      case QuickStatType.FIXED:
        return 'Fixed Expenses';
      case QuickStatType.EMIS:
        return 'EMI Payments';
      case QuickStatType.COMPLETED:
        return 'Completed Goals';
      case QuickStatType.INCOMPLETE:
        return 'Savings Goals';
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

  const combinedTransactions = [...expenses, ...oneOffSavings];

  return (
    <BSafeAreaView edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={() => syncSplitwise()}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Gradient Header */}
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

        {/* Budget Card - Overlaps Header */}
        <BView paddingX={SpacingValue.LG} style={styles.budgetCardWrapper}>
          <BView
            padding={SpacingValue.LG}
            bg={themeColors.background}
            style={[styles.budgetCard, { shadowColor: themeColors.text }]}
          >
            <BText variant={TextVariant.CAPTION} muted style={{ marginBottom: Spacing.xs }}>
              Monthly Budget Remaining
            </BText>
            {rollover > 0 && (
              <BView row align="center" style={{ marginBottom: Spacing.xxs }}>
                <BText variant={TextVariant.CAPTION} style={{ color: themeColors.success }}>
                  +{formatCurrency(rollover)} from last month
                </BText>
                <BButton
                  variant={ButtonVariant.GHOST}
                  onPress={handleResetRollover}
                  loading={isResettingRollover}
                  style={{ marginLeft: Spacing.xs, padding: Spacing.xxs }}
                >
                  <BIcon name="close-circle-outline" color={themeColors.textMuted} size="sm" />
                </BButton>
              </BView>
            )}
            <BText variant={TextVariant.HEADING} style={{ marginBottom: Spacing.md }}>
              {formatCurrency(budgetRemaining)}
            </BText>
            {/* Progress Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: themeColors.muted }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(budgetUsedPercent, 100)}%`, backgroundColor: themeColors.primary },
                ]}
              />
              {clampedReceivablesPercent > 0 && (
                <View
                  style={[
                    styles.progressBarFill,
                    styles.progressBarReceivables,
                    {
                      width: `${clampedReceivablesPercent}%`,
                      left: `${Math.min(budgetUsedPercent, 100)}%`,
                      backgroundColor: themeColors.success,
                    },
                  ]}
                />
              )}
            </View>
            <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
              {budgetUsedPercent}% used
              {clampedReceivablesPercent > 0 ? ` · ${clampedReceivablesPercent}% in transit` : ''}
            </BText>
          </BView>
        </BView>

        {/* Split Balances Card */}
        <SplitBalancesCard totalOwed={totalOwed} totalOwing={totalOwing} isLoading={isBalancesLoading} />

        {/* Spent/Saved Cards */}
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

        {/* Quick Stats */}
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
                  { shadowColor: themeColors.text },
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

        {/* Recent Transactions */}
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
            combinedTransactions.map((item, index) => (
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
                    isSplitwiseSynced={'sourceType' in item ? item.sourceType === 'splitwise' : false}
                  />
                </BLink>
              </BView>
            ))
          )}
        </BView>
      </ScrollView>

      {/* FAB */}
      <BFAB onPress={() => setIsAddTransactionModalVisible(true)} />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={isAddTransactionModalVisible}
        onClose={() => setIsAddTransactionModalVisible(false)}
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
        onMarkGoalComplete={(goalId) => {
          markGoalAsCompleted(goalId);
          setQuickStatSheetVisible(false);
        }}
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
  budgetCard: {
    borderRadius: BorderRadius.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressBarBg: {
    height: Spacing.xs,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  progressBarReceivables: {
    position: 'absolute',
    top: 0,
    bottom: 0,
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
});
