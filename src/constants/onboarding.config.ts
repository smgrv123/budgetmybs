import type { DebtPayoffPreference } from '@/db/types';
import { DebtLabels, DebtPayoffPreferenceEnum, FixedExpenseLabels, SavingsLabels } from '@/db/types';

export const OTHER_TYPE_VALUE = 'other';

export const isOtherType = (type: string) => type === OTHER_TYPE_VALUE;

// ============================================
// STEP DEFINITIONS
// ============================================

export enum OnboardingStepId {
  PROFILE = 'profile',
  FIXED_EXPENSES = 'fixed-expenses',
  DEBTS = 'debts',
  SAVINGS = 'savings',
}

export interface OnboardingStepConfig {
  id: OnboardingStepId;
  enabled: boolean;
  required: boolean; // If true, user cannot skip
  order: number;
}

export const OnboardingSteps: OnboardingStepConfig[] = [
  { id: OnboardingStepId.PROFILE, enabled: true, required: true, order: 1 },
  { id: OnboardingStepId.FIXED_EXPENSES, enabled: true, required: false, order: 2 },
  { id: OnboardingStepId.DEBTS, enabled: true, required: false, order: 3 },
  { id: OnboardingStepId.SAVINGS, enabled: true, required: false, order: 4 },
];

export const getEnabledSteps = () => OnboardingSteps.filter((step) => step.enabled).sort((a, b) => a.order - b.order);

export const getTotalSteps = () => getEnabledSteps().length + 1; // +1 for confirmation

// ============================================
// DROPDOWN OPTIONS
// ============================================

export interface DropdownOptionConfig {
  value: string;
  label: string;
}

export const FixedExpenseTypeOptions: DropdownOptionConfig[] = Object.entries(FixedExpenseLabels).map(
  ([value, label]) => ({
    value,
    label,
  })
);

export const DebtTypeOptions: DropdownOptionConfig[] = Object.entries(DebtLabels).map(([value, label]) => ({
  value,
  label,
}));

export const SavingsTypeOptions: DropdownOptionConfig[] = Object.entries(SavingsLabels).map(([value, label]) => ({
  value,
  label,
}));

// ============================================
// FIELD CONFIGURATION
// ============================================

export interface FieldConfig {
  id: string;
  type: 'text' | 'currency' | 'number' | 'dropdown';
  required: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
}

export const ProfileFieldConfig: FieldConfig[] = [
  { id: 'name', type: 'text', required: true, maxLength: 50 },
  { id: 'salary', type: 'currency', required: true, min: 0 },
  { id: 'monthlySavingsTarget', type: 'currency', required: true, min: 0 },
  { id: 'frivolousBudget', type: 'currency', required: true, min: 0 },
];

export const FixedExpenseFieldConfig: FieldConfig[] = [
  { id: 'name', type: 'text', required: true, maxLength: 100 },
  { id: 'type', type: 'dropdown', required: true },
  { id: 'amount', type: 'currency', required: true, min: 0 },
  { id: 'dayOfMonth', type: 'number', required: false, min: 1, max: 31 },
];

export const DebtFieldConfig: FieldConfig[] = [
  { id: 'name', type: 'text', required: true, maxLength: 100 },
  { id: 'type', type: 'dropdown', required: true },
  { id: 'principal', type: 'currency', required: true, min: 0 },
  { id: 'interestRate', type: 'number', required: true, min: 0, max: 100 },
  { id: 'tenureMonths', type: 'number', required: true, min: 1 },
  { id: 'dayOfMonth', type: 'number', required: false, min: 1, max: 31 },
];

export const SavingsFieldConfig: FieldConfig[] = [
  { id: 'name', type: 'text', required: true, maxLength: 100 },
  { id: 'type', type: 'dropdown', required: true },
  { id: 'targetAmount', type: 'currency', required: true, min: 0 },
];

// ============================================
// DEBT PAYOFF STRATEGIES
// ============================================

/**
 * Strategy card configurations for debt payoff selector
 */
export const DEBT_PAYOFF_STRATEGY_CONFIGS: {
  key: DebtPayoffPreference;
  label: string;
  description: string;
}[] = [
  {
    key: DebtPayoffPreferenceEnum.AVALANCHE,
    label: 'Avalanche',
    description: 'Highest interest first',
  },
  {
    key: DebtPayoffPreferenceEnum.SNOWBALL,
    label: 'Snowball',
    description: 'Smallest balance first',
  },
];

/**
 * Detailed information for debt payoff strategies (modal content)
 */
export const DEBT_PAYOFF_STRATEGY_INFO: Record<
  DebtPayoffPreference,
  {
    title: string;
    description: string;
    benefit: string;
    example: string;
  }
> = {
  avalanche: {
    title: 'Avalanche Method',
    description: 'Pay off debts with the highest interest rates first',
    benefit: 'Saves the most money on interest over time',
    example: 'If you have a credit card at 18% APR and a personal loan at 12%, prioritize the credit card.',
  },
  snowball: {
    title: 'Snowball Method',
    description: 'Pay off debts with the smallest balances first',
    benefit: 'Provides quick wins and psychological motivation',
    example: 'Pay off small debts first to build momentum and stay motivated.',
  },
};
