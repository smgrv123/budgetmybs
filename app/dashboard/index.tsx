import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { createQuickStats, createStatCards, RECENT_TRANSACTIONS, type Transaction } from '@/constants/dashboard.config';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { BButton, BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '@/src/hooks';
import { calculateEMI } from '@/src/store';

// Dashboard gradient colors
const HEADER_GRADIENT: [string, string, string] = [
  Colors.light.confirmationGradientStart,
  Colors.light.confirmationGradientMiddle,
  Colors.light.confirmationGradientEnd,
];

// Format date for header using dayjs
const formatDate = (): string => dayjs().format('dddd, D MMMM');

export default function DashboardScreen() {
  const { profile, isProfileLoading, isProfileError, refetchProfile } = useProfile();
  const { fixedExpenses, isFixedExpensesLoading } = useFixedExpenses();
  const { debts, isDebtsLoading } = useDebts();
  const { savingsGoals, isSavingsGoalsLoading } = useSavingsGoals();

  const isLoading = isProfileLoading || isFixedExpensesLoading || isDebtsLoading || isSavingsGoalsLoading;

  // Calculate totals
  const totalFixedExpenses = fixedExpenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const totalEMI = debts?.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0) ?? 0;
  const savingsTarget = profile?.monthlySavingsTarget ?? 0;
  const monthlyIncome = profile?.salary ?? 0;

  // Calculate budget remaining (placeholder - would need actual spending tracking)
  const totalCommitments = totalFixedExpenses + totalEMI + savingsTarget;
  const budgetRemaining = monthlyIncome - totalCommitments;
  const budgetUsedPercent = monthlyIncome > 0 ? Math.round((totalCommitments / monthlyIncome) * 100) : 0;

  // Placeholder spending data
  const spentThisMonth = Math.round(totalCommitments * 0.6);
  const savedThisMonth = Math.round(savingsTarget * 0.5);

  // Data-driven cards from constants
  const statCards = createStatCards(spentThisMonth, savedThisMonth);
  const quickStats = createQuickStats(totalFixedExpenses, totalEMI, savingsGoals?.length ?? 0);

  if (isLoading) {
    return (
      <BSafeAreaView style={styles.container}>
        <BView flex center>
          <BIcon name="sync" color={Colors.light.primary} size="lg" />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            Loading your dashboard...
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (isProfileError) {
    return (
      <BSafeAreaView style={styles.container}>
        <BView flex center padding={SpacingValue.XL}>
          <BIcon name="alert-circle-outline" color={Colors.light.error} size="lg" />
          <BText variant={TextVariant.SUBHEADING} center style={{ marginTop: Spacing.md }}>
            Something went wrong
          </BText>
          <BText variant={TextVariant.CAPTION} muted center style={{ marginTop: Spacing.xs }}>
            We couldn&apos;t load your data. Please try again.
          </BText>
          <BView style={{ marginTop: Spacing.xl }}>
            <BButton onPress={() => refetchProfile()} style={styles.retryButton}>
              <BText style={styles.retryButtonText}>Retry</BText>
            </BButton>
          </BView>
        </BView>
      </BSafeAreaView>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <BView row padding={SpacingValue.MD} style={styles.transactionCard}>
      <BView flex>
        <BView row style={{ alignItems: 'center', gap: Spacing.xs }}>
          <BText variant={TextVariant.LABEL}>{item.name}</BText>
          {item.isImpulse && (
            <BView style={styles.impulseTag}>
              <BText style={styles.impulseText}>Impulse</BText>
            </BView>
          )}
        </BView>
        <BText variant={TextVariant.CAPTION} muted>
          {item.category} • {item.date}
        </BText>
      </BView>
      <BText variant={TextVariant.LABEL} style={{ color: Colors.light.error }}>
        -₹{item.amount.toLocaleString('en-IN')}
      </BText>
    </BView>
  );

  return (
    <BSafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerContent}>
            <BText style={styles.dateText}>{formatDate()}</BText>
            <BView row style={styles.headerRow}>
              <BText style={styles.greeting}>Hey, {profile?.name || 'there'}!</BText>
              <BIcon name="settings-outline" color={Colors.light.white} size="md" />
            </BView>
          </View>
        </LinearGradient>

        {/* Budget Card - Overlaps Header */}
        <BView paddingX={SpacingValue.LG} style={styles.budgetCardWrapper}>
          <BView padding={SpacingValue.LG} style={styles.budgetCard}>
            <BText variant={TextVariant.CAPTION} muted style={{ marginBottom: Spacing.xs }}>
              Monthly Budget Remaining
            </BText>
            <BText variant={TextVariant.HEADING} style={{ marginBottom: Spacing.md }}>
              ₹{budgetRemaining.toLocaleString('en-IN')}
            </BText>
            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(budgetUsedPercent, 100)}%` }]} />
            </View>
            <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
              {budgetUsedPercent}% used
            </BText>
          </BView>
        </BView>

        {/* Spent/Saved Cards */}
        <BView row gap={SpacingValue.MD} paddingX={SpacingValue.LG} marginY={SpacingValue.MD}>
          {statCards.map((item) => (
            <BView key={item.id} flex padding={SpacingValue.MD} style={styles.statCard}>
              <BText variant={TextVariant.CAPTION} muted>
                {item.label}
              </BText>
              <BText variant={TextVariant.SUBHEADING} style={{ color: item.color }}>
                {item.value}
              </BText>
            </BView>
          ))}
        </BView>

        {/* Quick Stats */}
        <BView paddingX={SpacingValue.LG} marginY={SpacingValue.SM}>
          <BText variant={TextVariant.SUBHEADING} style={{ marginBottom: Spacing.md }}>
            Quick Stats
          </BText>
          <BView row gap={SpacingValue.SM}>
            {quickStats.map((item) => (
              <BView key={item.id} flex center padding={SpacingValue.MD} style={styles.quickStatCard}>
                <BIcon name={item.icon as any} color={item.color} size="md" />
                <BText variant={TextVariant.LABEL} style={{ marginTop: Spacing.xs }}>
                  {item.value}
                </BText>
                <BText variant={TextVariant.CAPTION} muted>
                  {item.label}
                </BText>
              </BView>
            ))}
          </BView>
        </BView>

        {/* Recent Transactions */}
        <BView paddingX={SpacingValue.LG} marginY={SpacingValue.LG}>
          <BView row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <BText variant={TextVariant.SUBHEADING}>Recent Transactions</BText>
            <BText variant={TextVariant.CAPTION} style={{ color: Colors.light.primary }}>
              See All
            </BText>
          </BView>
          <FlatList
            data={RECENT_TRANSACTIONS}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <BView style={{ height: Spacing.sm }} />}
          />
        </BView>
      </ScrollView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {},
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.light.white,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.light.white,
  },
  budgetCardWrapper: {
    marginTop: -Spacing['2xl'],
  },
  budgetCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.light.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  statCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickStatCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  transactionCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  impulseTag: {
    backgroundColor: Colors.light.warningBackground,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  impulseText: {
    fontSize: FontSize.xs,
    color: Colors.light.warning,
    fontWeight: FontWeight.medium,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryButtonText: {
    color: Colors.light.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
