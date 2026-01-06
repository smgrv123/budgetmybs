import { create } from 'zustand';

export interface ProfileData {
  name: string;
  salary: number;
  monthlySavingsTarget: number;
  frivolousBudget: number;
}

export interface FixedExpenseData {
  tempId: string;
  name: string;
  type: string;
  customType?: string;
  amount: number;
  dayOfMonth?: number | null;
}

export interface DebtData {
  tempId: string;
  name: string;
  type: string;
  customType?: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
}

export interface SavingsGoalData {
  tempId: string;
  name: string;
  type: string;
  customType?: string;
  targetAmount: number;
}

export interface OnboardingState {
  // Data
  profile: ProfileData;
  fixedExpenses: FixedExpenseData[];
  debts: DebtData[];
  savingsGoals: SavingsGoalData[];

  // Actions - Profile
  setProfile: (data: Partial<ProfileData>) => void;
  updateProfileField: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;

  // Actions - Fixed Expenses
  addFixedExpense: (expense: Omit<FixedExpenseData, 'tempId'>) => void;
  updateFixedExpense: (tempId: string, data: Partial<FixedExpenseData>) => void;
  removeFixedExpense: (tempId: string) => void;

  // Actions - Debts
  addDebt: (debt: Omit<DebtData, 'tempId'>) => void;
  updateDebt: (tempId: string, data: Partial<DebtData>) => void;
  removeDebt: (tempId: string) => void;

  // Actions - Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoalData, 'tempId'>) => void;
  updateSavingsGoal: (tempId: string, data: Partial<SavingsGoalData>) => void;
  removeSavingsGoal: (tempId: string) => void;

  // Actions - General
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialProfile: ProfileData = {
  name: '',
  salary: 0,
  monthlySavingsTarget: 0,
  frivolousBudget: 0,
};

const initialState = {
  profile: initialProfile,
  fixedExpenses: [] as FixedExpenseData[],
  debts: [] as DebtData[],
  savingsGoals: [] as SavingsGoalData[],
};

// ============================================
// HELPER: Generate temp ID
// ============================================

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ============================================
// STORE
// ============================================

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  // Profile Actions
  setProfile: (data) =>
    set((state) => ({
      profile: { ...state.profile, ...data },
    })),

  updateProfileField: (field, value) =>
    set((state) => ({
      profile: { ...state.profile, [field]: value },
    })),

  // Fixed Expense Actions
  addFixedExpense: (expense) =>
    set((state) => ({
      fixedExpenses: [...state.fixedExpenses, { ...expense, tempId: generateTempId() }],
    })),

  updateFixedExpense: (tempId, data) =>
    set((state) => ({
      fixedExpenses: state.fixedExpenses.map((e) => (e.tempId === tempId ? { ...e, ...data } : e)),
    })),

  removeFixedExpense: (tempId) =>
    set((state) => ({
      fixedExpenses: state.fixedExpenses.filter((e) => e.tempId !== tempId),
    })),

  // Debt Actions
  addDebt: (debt) =>
    set((state) => ({
      debts: [...state.debts, { ...debt, tempId: generateTempId() }],
    })),

  updateDebt: (tempId, data) =>
    set((state) => ({
      debts: state.debts.map((d) => (d.tempId === tempId ? { ...d, ...data } : d)),
    })),

  removeDebt: (tempId) =>
    set((state) => ({
      debts: state.debts.filter((d) => d.tempId !== tempId),
    })),

  // Savings Goal Actions
  addSavingsGoal: (goal) =>
    set((state) => ({
      savingsGoals: [...state.savingsGoals, { ...goal, tempId: generateTempId() }],
    })),

  updateSavingsGoal: (tempId, data) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) => (g.tempId === tempId ? { ...g, ...data } : g)),
    })),

  removeSavingsGoal: (tempId) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.tempId !== tempId),
    })),

  // Reset
  reset: () => set(initialState),
}));

// ============================================
// SELECTORS
// ============================================

export const selectProfile = (state: OnboardingState) => state.profile;
export const selectFixedExpenses = (state: OnboardingState) => state.fixedExpenses;
export const selectDebts = (state: OnboardingState) => state.debts;
export const selectSavingsGoals = (state: OnboardingState) => state.savingsGoals;

// Computed values
export const selectTotalFixedExpenses = (state: OnboardingState) =>
  state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

export const selectTotalDebtEMI = (state: OnboardingState) =>
  state.debts.reduce((sum, d) => sum + calculateEMI(d.principal, d.interestRate, d.tenureMonths), 0);

export const selectTotalSavingsTarget = (state: OnboardingState) =>
  state.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

// ============================================
// EMI CALCULATOR
// ============================================

/**
 * Calculate EMI using the formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 *
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (percentage, e.g., 10 for 10%)
 * @param tenureMonths - Loan tenure in months
 * @returns Monthly EMI amount (rounded to nearest rupee)
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;

  // If no interest, simple division
  if (annualRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const r = annualRate / 12 / 100; // Monthly interest rate
  const n = tenureMonths;

  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return Math.round(emi);
}
