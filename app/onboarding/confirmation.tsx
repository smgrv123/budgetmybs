import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import {
  DebtTypeOptions,
  FixedExpenseTypeOptions,
  SavingsTypeOptions,
  getTotalSteps,
} from '@/constants/onboarding.config';
import { OnboardingStrings } from '@/constants/onboarding.strings';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { BButton, BSafeAreaView, BStepIndicator, BText, BView } from '@/src/components';
import { calculateEMI, useOnboardingStore } from '@/src/store';

import { createDebt } from '@/db/queries/debts';
import { createFixedExpense } from '@/db/queries/fixed-expenses';
import { upsertProfile } from '@/db/queries/profile';
import { createSavingsGoal } from '@/db/queries/savings';

const { confirmation, common } = OnboardingStrings;

export default function ConfirmationScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const { profile, fixedExpenses, debts, savingsGoals, reset } = useOnboardingStore();

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = async () => {
    setIsSaving(true);

    try {
      // 1. Save Profile
      await upsertProfile({
        name: profile.name,
        salary: profile.salary,
        frivolousBudget: profile.frivolousBudget,
        monthlySavingsTarget: profile.monthlySavingsTarget,
      });

      // 2. Save Fixed Expenses
      for (const expense of fixedExpenses) {
        await createFixedExpense({
          name: expense.name,
          type: expense.type,
          customType: expense.customType || null,
          amount: expense.amount,
          dayOfMonth: expense.dayOfMonth,
        });
      }

      // 3. Save Debts (with calculated EMI)
      for (const debt of debts) {
        const emiAmount = calculateEMI(debt.principal, debt.interestRate, debt.tenureMonths);
        await createDebt({
          name: debt.name,
          type: debt.type,
          customType: debt.customType || null,
          principal: debt.principal,
          remaining: debt.principal, // Initial remaining = principal
          interestRate: debt.interestRate,
          emiAmount,
          tenureMonths: debt.tenureMonths,
          remainingMonths: debt.tenureMonths, // Initial remaining months = tenure
          startDate: null,
        });
      }

      // 4. Save Savings Goals
      for (const goal of savingsGoals) {
        await createSavingsGoal({
          name: goal.name,
          type: goal.type,
          customType: goal.customType || null,
          targetAmount: goal.targetAmount,
        });
      }

      // Reset the store
      reset();

      // Navigate to main app\n      router.replace({ pathname: '/' } as any);
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      Alert.alert('Error', 'Failed to save your data. Please try again.', [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string, options: { value: string; label: string }[]) => {
    const option = options.find((o) => o.value === type);
    return option?.label || type;
  };

  // Calculate totals
  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEMI = debts.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const monthlyCommitments = totalFixedExpenses + totalEMI + profile.monthlySavingsTarget;
  const remainingAfterCommitments = profile.salary - monthlyCommitments;

  return (
    <BSafeAreaView style={styles.container}>
      {/* Step Indicator */}
      <BView style={styles.stepIndicatorContainer}>
        <BStepIndicator currentStep={getTotalSteps()} totalSteps={getTotalSteps()} />
      </BView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary */}
        <BView style={styles.section}>
          <BText style={styles.sectionTitle}>{confirmation.profileSection.title}</BText>
          <BView style={styles.summaryCard}>
            <BView style={styles.summaryRow}>
              <BText style={styles.summaryLabel}>{confirmation.profileSection.name}</BText>
              <BText style={styles.summaryValue}>{profile.name}</BText>
            </BView>
            <BView style={styles.summaryRow}>
              <BText style={styles.summaryLabel}>{confirmation.profileSection.salary}</BText>
              <BText style={styles.summaryValue}>
                {common.currency} {profile.salary.toLocaleString('en-IN')}
              </BText>
            </BView>
            <BView style={styles.summaryRow}>
              <BText style={styles.summaryLabel}>{confirmation.profileSection.savingsTarget}</BText>
              <BText style={styles.summaryValue}>
                {common.currency} {profile.monthlySavingsTarget.toLocaleString('en-IN')}
              </BText>
            </BView>
            <BView style={styles.summaryRow}>
              <BText style={styles.summaryLabel}>{confirmation.profileSection.funBudget}</BText>
              <BText style={styles.summaryValue}>
                {common.currency} {profile.frivolousBudget.toLocaleString('en-IN')}
              </BText>
            </BView>
          </BView>
        </BView>

        {/* Fixed Expenses Summary */}
        {fixedExpenses.length > 0 && (
          <BView style={styles.section}>
            <BView style={styles.sectionHeader}>
              <BText style={styles.sectionTitle}>{confirmation.fixedExpensesSection.title}</BText>
              <BText style={styles.sectionTotal}>
                {common.currency} {totalFixedExpenses.toLocaleString('en-IN')}/mo
              </BText>
            </BView>
            {fixedExpenses.map((expense) => (
              <BView key={expense.tempId} style={styles.itemRow}>
                <BView>
                  <BText style={styles.itemName}>{expense.name}</BText>
                  <BText style={styles.itemType}>{getTypeLabel(expense.type, FixedExpenseTypeOptions)}</BText>
                </BView>
                <BText style={styles.itemAmount}>
                  {common.currency} {expense.amount.toLocaleString('en-IN')}
                </BText>
              </BView>
            ))}
          </BView>
        )}

        {/* Debts Summary */}
        {debts.length > 0 && (
          <BView style={styles.section}>
            <BView style={styles.sectionHeader}>
              <BText style={styles.sectionTitle}>{confirmation.debtsSection.title}</BText>
              <BText style={styles.sectionTotal}>
                {common.currency} {totalEMI.toLocaleString('en-IN')}/mo
              </BText>
            </BView>
            {debts.map((debt) => {
              const emi = calculateEMI(debt.principal, debt.interestRate, debt.tenureMonths);
              return (
                <BView key={debt.tempId} style={styles.itemRow}>
                  <BView>
                    <BText style={styles.itemName}>{debt.name}</BText>
                    <BText style={styles.itemType}>
                      {getTypeLabel(debt.type, DebtTypeOptions)} • EMI: {common.currency} {emi.toLocaleString('en-IN')}
                    </BText>
                  </BView>
                  <BText style={styles.itemAmount}>
                    {common.currency} {debt.principal.toLocaleString('en-IN')}
                  </BText>
                </BView>
              );
            })}
          </BView>
        )}

        {/* Savings Goals Summary */}
        {savingsGoals.length > 0 && (
          <BView style={styles.section}>
            <BView style={styles.sectionHeader}>
              <BText style={styles.sectionTitle}>{confirmation.savingsSection.title}</BText>
              <BText style={styles.sectionTotal}>
                {common.currency} {totalSavingsTarget.toLocaleString('en-IN')} target
              </BText>
            </BView>
            {savingsGoals.map((goal) => (
              <BView key={goal.tempId} style={styles.itemRow}>
                <BView>
                  <BText style={styles.itemName}>{goal.name}</BText>
                  <BText style={styles.itemType}>{getTypeLabel(goal.type, SavingsTypeOptions)}</BText>
                </BView>
                <BText style={styles.itemAmount}>
                  {common.currency} {goal.targetAmount.toLocaleString('en-IN')}
                </BText>
              </BView>
            ))}
          </BView>
        )}

        {/* Monthly Overview */}
        <BView style={styles.section}>
          <BText style={styles.sectionTitle}>{confirmation.overviewSection.title}</BText>
          <BView style={styles.overviewCard}>
            <BView style={styles.overviewRow}>
              <BText style={styles.overviewLabel}>{confirmation.overviewSection.monthlyIncome}</BText>
              <BText style={styles.overviewIncome}>
                {common.currency} {profile.salary.toLocaleString('en-IN')}
              </BText>
            </BView>
            <BView style={styles.overviewRow}>
              <BText style={styles.overviewLabel}>{confirmation.overviewSection.totalCommitments}</BText>
              <BText style={styles.overviewExpense}>
                - {common.currency} {monthlyCommitments.toLocaleString('en-IN')}
              </BText>
            </BView>
            <BView style={[styles.overviewRow, styles.overviewTotal]}>
              <BText style={styles.overviewTotalLabel}>{confirmation.overviewSection.remaining}</BText>
              <BText style={[styles.overviewTotalValue, remainingAfterCommitments < 0 && styles.overviewNegative]}>
                {common.currency} {remainingAfterCommitments.toLocaleString('en-IN')}
              </BText>
            </BView>
          </BView>
        </BView>
      </ScrollView>

      {/* Footer */}
      <BView style={styles.footer}>
        <BButton variant="secondary" onPress={handleBack} style={styles.backButton}>
          <BText style={styles.backButtonText}>{confirmation.backButton}</BText>
        </BButton>
        <BButton onPress={handleConfirm} loading={isSaving} disabled={isSaving} style={styles.confirmButton}>
          <BText style={styles.confirmButtonText}>{confirmation.confirmButton}</BText>
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
  stepIndicatorContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  sectionTotal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.light.primary,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryLabel: {
    fontSize: FontSize.base,
    color: Colors.light.textMuted,
  },
  summaryValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  itemType: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  itemAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  overviewCard: {
    backgroundColor: Colors.light.cardSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  overviewLabel: {
    fontSize: FontSize.base,
    color: Colors.light.textMuted,
  },
  overviewIncome: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.light.success,
  },
  overviewExpense: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.light.error,
  },
  overviewTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  overviewTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  overviewTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.light.success,
  },
  overviewNegative: {
    color: Colors.light.error,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.light.muted,
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
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
