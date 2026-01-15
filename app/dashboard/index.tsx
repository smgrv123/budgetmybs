import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { createQuickStats, createStatCards, RECENT_TRANSACTIONS, type Transaction } from '@/constants/dashboard.config';
import { BorderRadius, Colors, Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { BButton, BCard, BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '@/src/hooks';
import { calculateEMI } from '@/src/utils/budget';
import { formatDate } from '@/src/utils/date';

// Dashboard gradient colors
const HEADER_GRADIENT: [string, string, string] = [
  Colors.light.confirmationGradientStart,
  Colors.light.confirmationGradientMiddle,
  Colors.light.confirmationGradientEnd,
];

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
      <BSafeAreaView>
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
      <BSafeAreaView>
        <BView flex center padding={SpacingValue.XL}>
          <BIcon name="alert-circle-outline" color={Colors.light.error} size="lg" />
          <BText variant={TextVariant.SUBHEADING} center style={{ marginTop: Spacing.md }}>
            Something went wrong
          </BText>
          <BText variant={TextVariant.CAPTION} muted center style={{ marginTop: Spacing.xs }}>
            We couldn&apos;t load your data. Please try again.
          </BText>
          <BView marginY="xl">
            <BButton onPress={() => refetchProfile()} paddingX="xl" paddingY="md" rounded="lg">
              <BText variant={TextVariant.LABEL} color={Colors.light.white}>
                Retry
              </BText>
            </BButton>
          </BView>
        </BView>
      </BSafeAreaView>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <BCard variant="default" style={{ padding: Spacing.md }}>
      <BView row justify="space-between" align="center">
        <BView flex>
          <BView row style={{ alignItems: 'center', gap: Spacing.xs }}>
            <BText variant={TextVariant.LABEL}>{item.name}</BText>
            {item.isImpulse && (
              <BView rounded="sm" paddingX="xs" paddingY="xxs" bg={Colors.light.warningBackground}>
                <BText variant={TextVariant.CAPTION} color={Colors.light.warning}>
                  Impulse
                </BText>
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
    </BCard>
  );

  return (
    <BSafeAreaView edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <BView>
            <BText variant={TextVariant.CAPTION} color={Colors.light.white} muted style={{ marginBottom: Spacing.xs }}>
              {formatDate()}
            </BText>
            <BView row justify="space-between" align="center">
              <BText variant={TextVariant.HEADING} color={Colors.light.white}>
                Hey, {profile?.name || 'there'}!
              </BText>
              <BIcon name="settings-outline" color={Colors.light.white} size="md" />
            </BView>
          </BView>
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
          <BView row gap={SpacingValue.SM}>
            {quickStats.map((item) => (
              <BCard key={item.id} variant="default" style={{ flex: 1, padding: Spacing.md }}>
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
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
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
    height: Spacing.xs,
    backgroundColor: Colors.light.muted,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xs,
  },
});
