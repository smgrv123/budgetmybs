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
import { BButton, BIcon, BSafeAreaView, BText, BView } from '@/src/components';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '@/src/hooks';
import { calculateEMI, useOnboardingStore } from '@/src/store';

const { common, plan } = OnboardingStrings;

// Types for budget breakdown items
interface BudgetBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
}

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
  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEMI = debts.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0);
  const totalCommitments = totalFixedExpenses + totalEMI + profile.monthlySavingsTarget;
  const remainingBudget = profile.salary - totalCommitments;

  // Calculate percentage of income
  const getPercentage = (amount: number): number => {
    if (profile.salary <= 0) return 0;
    return Math.round((amount / profile.salary) * 100);
  };

  // Build budget breakdown items array
  const buildBudgetBreakdownItems = (): BudgetBreakdownItem[] => {
    const items: BudgetBreakdownItem[] = [];

    if (totalFixedExpenses > 0) {
      items.push({
        id: 'fixed-expenses',
        name: plan.categories.fixedExpenses,
        amount: totalFixedExpenses,
        percentage: getPercentage(totalFixedExpenses),
      });
    }

    if (totalEMI > 0) {
      items.push({
        id: 'emi-payments',
        name: plan.categories.emiPayments,
        amount: totalEMI,
        percentage: getPercentage(totalEMI),
      });
    }

    if (profile.monthlySavingsTarget > 0) {
      items.push({
        id: 'savings-target',
        name: plan.categories.savingsTarget,
        amount: profile.monthlySavingsTarget,
        percentage: getPercentage(profile.monthlySavingsTarget),
      });
    }

    if (remainingBudget > 0) {
      items.push({
        id: 'groceries-essentials',
        name: plan.categories.groceriesEssentials,
        amount: remainingBudget,
        percentage: getPercentage(remainingBudget),
      });
    }

    return items;
  };

  const budgetBreakdownItems = buildBudgetBreakdownItems();

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
    <BView row style={styles.breakdownCard}>
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
  );

  const renderRecommendation = ({ item }: { item: string }) => (
    <BText style={styles.recommendationItem}>• {item}</BText>
  );

  return (
    <BSafeAreaView style={styles.container}>
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
          <BText style={styles.incomeLabel}>{plan.monthlyIncome}</BText>
          <BText variant={TextVariant.HEADING} style={styles.incomeAmount}>
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
        <BButton variant={ButtonVariant.SECONDARY} onPress={handleBack} disabled={isSaving} style={styles.backButton}>
          <BText style={styles.backButtonText}>{plan.backButton}</BText>
        </BButton>
        <BButton onPress={handleConfirm} loading={isSaving} disabled={isSaving} style={styles.confirmButton}>
          <BText style={styles.confirmButtonText}>{plan.confirmButton}</BText>
        </BButton>
      </BView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  incomeCard: {
    borderRadius: BorderRadius.lg,
    gap: 10,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  incomeLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.white,
    opacity: 0.8,
  },
  incomeAmount: {
    fontSize: FontSize['3xl'],
    color: Colors.light.white,
  },
  breakdownCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  recommendationsCard: {
    backgroundColor: Colors.light.recommendationBg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  recommendationItem: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    lineHeight: FontSize.sm * 1.6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.light.muted,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    color: Colors.light.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
  },
  confirmButtonText: {
    color: Colors.light.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
