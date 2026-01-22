import type { DebtType, FixedExpenseType, SavingsType } from '@/db/types';
import type { ReactNode } from 'react';

// From store/onboardingStore.ts
export type ProfileData = {
  name: string;
  salary: number;
  monthlySavingsTarget: number;
  frivolousBudget: number;
};

export type FixedExpenseData = {
  tempId: string;
  name: string;
  type: FixedExpenseType;
  customType?: string;
  amount: number;
  dayOfMonth?: number | null;
};

export type DebtData = {
  tempId: string;
  name: string;
  type: DebtType;
  customType?: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
};

export type SavingsGoalData = {
  tempId: string;
  name: string;
  type: SavingsType;
  customType?: string;
  targetAmount: number;
};

// From components/onboarding/steps/profileStep.tsx
export type ProfileField = {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  icon?: string;
};

// From components/onboarding/listStep.tsx
export type ItemCardConfig<T> = {
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getAmount: (item: T) => number;
  getSecondaryAmount?: (item: T) => number;
  secondaryLabel?: string;
};

export type ListStepStrings = {
  heading: string;
  subheading: string;
  addButton: string;
  continueButton: string;
  skipButton: string;
  form: {
    addButton: string;
    cancelButton: string;
  };
};

export type CustomTypeModalConfig = {
  title: string;
  placeholder: string;
  addButton: string;
  cancelButton: string;
};
