import type { DebtData, FixedExpenseData, ProfileData, SavingsGoalData } from '@/src/types';
import { calculateEMI } from '@/src/utils/budget';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '../hooks';

export type SaveOnboardingDataParams = {
  profile: ProfileData;
  fixedExpenses: FixedExpenseData[];
  debts: DebtData[];
  savingsGoals: SavingsGoalData[];
};

/**
 * Save all onboarding data to the database in parallel
 * Uses mutation functions passed from the component for proper hook context
 */
export const useSaveOnboardingData = () => {
  const { upsertProfileAsync } = useProfile();
  const { createFixedExpenseAsync } = useFixedExpenses();
  const { createDebtAsync } = useDebts();
  const { createSavingsGoalAsync } = useSavingsGoals();

  const saveOnboardingData = async ({ profile, fixedExpenses, debts, savingsGoals }: SaveOnboardingDataParams) => {
    await Promise.all([
      // Save Profile
      upsertProfileAsync({
        name: profile.name,
        salary: profile.salary,
        frivolousBudget: profile.frivolousBudget,
        monthlySavingsTarget: profile.monthlySavingsTarget,
        debtPayoffPreference: profile.debtPayoffPreference,
      }),

      // Save Fixed Expenses
      ...fixedExpenses.map((expense) =>
        createFixedExpenseAsync({
          name: expense.name,
          type: expense.type,
          customType: expense.customType || null,
          amount: expense.amount,
          dayOfMonth: expense.dayOfMonth ?? null,
        })
      ),

      // Save Debts with calculated EMI
      ...debts.map((debt) => {
        const emiAmount = calculateEMI(debt.principal, debt.interestRate, debt.tenureMonths);
        return createDebtAsync({
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
      }),

      // Save Savings Goals
      ...savingsGoals.map((goal) =>
        createSavingsGoalAsync({
          name: goal.name,
          type: goal.type,
          customType: goal.customType || null,
          targetAmount: goal.targetAmount,
        })
      ),
    ]);
  };
  return { saveOnboardingData };
};
