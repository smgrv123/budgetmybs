import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import {
  BorderRadius,
  ButtonVariant,
  Colors,
  ComponentSize,
  FontSize,
  FontWeight,
  Spacing,
  SpacingValue,
  TextVariant,
} from '@/constants/theme';
import { BButton, BCard, BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '@/src/hooks';
import { useOnboardingStore } from '@/src/store';
import {
  type BudgetBreakdownItem,
  buildBudgetBreakdownItems,
  calculateEMI,
  calculateTotalEMI,
  calculateTotalFixedExpenses,
} from '@/src/utils/budget';

const { common, plan } = OnboardingStrings;

// Confirmation screen gradient colors
const CONFIRMATION_GRADIENT: [string, string, string] = [
  Colors.light.confirmationGradientStart,
  Colors.light.confirmationGradientMiddle,
  Colors.light.confirmationGradientEnd,
];

export default function ConfirmationScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const { profile, fixedExpenses, debts, savingsGoals, reset } = useOnboardingStore();

  // TanStack Query hooks for mutations
  const { upsertProfileAsync } = useProfile();
  const { createFixedExpenseAsync } = useFixedExpenses();
  const { createDebtAsync } = useDebts();
  const { createSavingsGoalAsync } = useSavingsGoals();

  // Calculate totals
  const totalFixedExpenses = calculateTotalFixedExpenses(fixedExpenses);
  const totalEMI = calculateTotalEMI(debts);
  const totalCommitments = totalFixedExpenses + totalEMI + profile.monthlySavingsTarget;
  const remainingBudget = profile.salary - totalCommitments;

  const budgetBreakdownItems = buildBudgetBreakdownItems(
    totalFixedExpenses,
    totalEMI,
    profile.monthlySavingsTarget,
    remainingBudget,
    plan.categories,
    profile.salary
  );

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = async () => {
    setIsSaving(true);

    try {
      // 1. Save Profile
      await upsertProfileAsync({
        name: profile.name,
        salary: profile.salary,
        frivolousBudget: profile.frivolousBudget,
        monthlySavingsTarget: profile.monthlySavingsTarget,
      });

      // 2. Save Fixed Expenses
      for (const expense of fixedExpenses) {
        await createFixedExpenseAsync({
          name: expense.name,
          type: expense.type,
          customType: expense.customType || null,
          amount: expense.amount,
          dayOfMonth: expense.dayOfMonth,
        });
      }

      // 3. Save Debts with calculated EMI
      for (const debt of debts) {
        const emiAmount = calculateEMI(debt.principal, debt.interestRate, debt.tenureMonths);
        await createDebtAsync({
          name: debt.name,
          type: debt.type,
          customType: debt.customType || null,
          principal: debt.principal,
          remaining: debt.principal,
          interestRate: debt.interestRate,
          emiAmount,
          tenureMonths: debt.tenureMonths,
          remainingMonths: debt.tenureMonths,
          startDate: null,
        });
      }

      // 4. Save Savings Goals
      for (const goal of savingsGoals) {
        await createSavingsGoalAsync({
          name: goal.name,
          type: goal.type,
          customType: goal.customType || null,
          targetAmount: goal.targetAmount,
        });
      }

      // Reset store and navigate to success screen
      reset();
      router.replace('/onboarding/success');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      Alert.alert('Error', 'Failed to save your data. Please try again.');
      setIsSaving(false);
    }
  };

  // Render functions for FlatLists
  const renderBudgetItem = ({ item }: { item: BudgetBreakdownItem }) => (
    <BCard variant="default" style={{ padding: Spacing.md, borderRadius: BorderRadius.base }}>
      <BView row justify="space-between" align="center">
        <BView>
          <BText variant={TextVariant.LABEL} style={{ marginBottom: Spacing.xxs }}>
            {item.name}
          </BText>
          <BText variant={TextVariant.CAPTION} muted>
            {item.percentage}
            {plan.ofIncome}
          </BText>
        </BView>
        <BText variant={TextVariant.LABEL} style={{ fontWeight: FontWeight.semibold }}>
          {common.currency}
          {item.amount.toLocaleString('en-IN')}
        </BText>
      </BView>
    </BCard>
  );

  const renderRecommendation = ({ item }: { item: string }) => (
    <BText variant={TextVariant.CAPTION} color={Colors.light.primary}>
      • {item}
    </BText>
  );

  return (
    <BSafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <BView row gap={SpacingValue.SM} marginY={SpacingValue.LG} style={{ alignItems: 'center' }}>
          <BIcon name="sparkles" color={Colors.light.warning} size={ComponentSize.MD} />
          <BText variant={TextVariant.SUBHEADING}>{plan.headerTitle}</BText>
        </BView>

        {/* Monthly Income Card */}
        <LinearGradient
          colors={CONFIRMATION_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.incomeCard}
        >
          <BText variant={TextVariant.CAPTION} color={Colors.light.white} muted>
            {plan.monthlyIncome}
          </BText>
          <BText variant={TextVariant.HEADING} color={Colors.light.white}>
            {common.currency}
            {profile.salary.toLocaleString('en-IN')}
          </BText>
        </LinearGradient>

        {/* Budget Breakdown */}
        <BView marginY={SpacingValue.XL}>
          <BText variant={TextVariant.SUBHEADING} style={{ marginBottom: Spacing.md }}>
            {plan.budgetBreakdown}
          </BText>
          <FlatList
            data={budgetBreakdownItems}
            renderItem={renderBudgetItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <BView style={{ height: Spacing.sm }} />}
          />
        </BView>

        {/* AI Recommendations */}
        <BView padding={SpacingValue.BASE} style={styles.recommendationsCard}>
          <BView row gap={SpacingValue.SM} marginY={SpacingValue.MD} style={{ alignItems: 'center' }}>
            <BText style={{ fontSize: FontSize.lg }}>💡</BText>
            <BText variant={TextVariant.LABEL}>{plan.aiRecommendations}</BText>
          </BView>
          <FlatList
            data={plan.recommendations}
            renderItem={renderRecommendation}
            keyExtractor={(item, index) => `rec-${index}`}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <BView style={{ height: Spacing.xs }} />}
          />
        </BView>
      </ScrollView>

      {/* Footer - Button Group */}
      <BView row gap={SpacingValue.MD} paddingX={SpacingValue['XL']} paddingY={SpacingValue.BASE} style={styles.footer}>
        <BButton
          variant={ButtonVariant.SECONDARY}
          onPress={handleBack}
          disabled={isSaving}
          rounded="lg"
          paddingY="sm"
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={Colors.light.text}>
            {plan.backButton}
          </BText>
        </BButton>
        <BButton onPress={handleConfirm} loading={isSaving} disabled={isSaving} rounded="lg" style={{ flex: 2 }}>
          <BText variant={TextVariant.LABEL} color={Colors.light.white}>
            {plan.confirmButton}
          </BText>
        </BButton>
      </BView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  incomeCard: {
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  recommendationsCard: {
    backgroundColor: Colors.light.recommendationBg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});
