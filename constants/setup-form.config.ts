import { DebtTypeOptions, FixedExpenseTypeOptions, SavingsTypeOptions } from '@/constants/onboarding.config';
import { OnboardingStrings } from '@/constants/onboarding.strings';
import type { FormField } from '@/src/components/onboarding';
import { debtSchema, fixedExpenseSchema, profileSchema, savingsGoalSchema } from '@/src/validation/onboarding';
import { ReactNode } from 'react';

import type { ZodSchema } from 'zod';

const { profile: profileStrings, fixedExpenses, debts, savings, common } = OnboardingStrings;

export interface ProfileFieldConfig {
  key: string;
  label: string;
  placeholder: string;
  keyboardType: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  helperText?: string;
  icon?: string;
  hasCurrencyIcon?: boolean;
}

export interface StepConfig {
  strings: {
    heading: string;
    subheading: string;
    addButton: string;
    continueButton: string;
    skipButton: string;
    form: { addButton: string; cancelButton: string };
  };
  initialFormData: Record<string, string>;
  validationSchema: ZodSchema;
  customTypeModal?: {
    title: string;
    placeholder: string;
    addButton: string;
    cancelButton: string;
  };
}

export const PROFILE_FIELD_CONFIGS: ProfileFieldConfig[] = [
  {
    key: 'name',
    label: profileStrings.fields.name.label,
    placeholder: profileStrings.fields.name.placeholder,
    keyboardType: 'default',
    autoCapitalize: 'words',
  },
  {
    key: 'salary',
    label: profileStrings.fields.salary.label,
    placeholder: profileStrings.fields.salary.placeholder,
    keyboardType: 'numeric',
    hasCurrencyIcon: true,
    icon: 'cash-outline',
  },
  {
    key: 'monthlySavingsTarget',
    label: profileStrings.fields.monthlySavingsTarget.label,
    placeholder: profileStrings.fields.monthlySavingsTarget.placeholder,
    keyboardType: 'numeric',
    helperText: profileStrings.fields.monthlySavingsTarget.helperText,
    hasCurrencyIcon: true,
    icon: 'wallet-outline',
  },
  {
    key: 'frivolousBudget',
    label: profileStrings.fields.frivolousBudget.label,
    placeholder: profileStrings.fields.frivolousBudget.placeholder,
    keyboardType: 'numeric',
    helperText: profileStrings.fields.frivolousBudget.helperText,
    hasCurrencyIcon: true,
    icon: 'gift-outline',
  },
];

export const FIXED_EXPENSE_FIELD_CONFIGS: Omit<FormField, 'leftIcon'>[] = [
  { key: 'name', type: 'input', placeholder: fixedExpenses.form.name.placeholder },
  {
    key: 'type',
    type: 'dropdown',
    placeholder: fixedExpenses.form.type.placeholder,
    options: FixedExpenseTypeOptions,
  },
  {
    key: 'amount',
    type: 'input',
    placeholder: fixedExpenses.form.amount.placeholder,
    keyboardType: 'numeric',
  },
  {
    key: 'dayOfMonth',
    type: 'input',
    placeholder: fixedExpenses.form.dayOfMonth.placeholder,
    keyboardType: 'numeric',
  },
];

export const DEBT_FIELD_CONFIGS: Omit<FormField, 'leftIcon'>[] = [
  { key: 'name', type: 'input', placeholder: debts.form.name.placeholder },
  { key: 'type', type: 'dropdown', placeholder: debts.form.type.placeholder, options: DebtTypeOptions },
  {
    key: 'principal',
    type: 'input',
    label: debts.form.principal.label,
    placeholder: debts.form.principal.placeholder,
    keyboardType: 'numeric',
  },
  {
    key: 'interestRate',
    type: 'input',
    label: debts.form.interestRate.label,
    placeholder: debts.form.interestRate.placeholder,
    keyboardType: 'numeric',
  },
  {
    key: 'tenureMonths',
    type: 'input',
    label: debts.form.tenureMonths.label,
    placeholder: debts.form.tenureMonths.placeholder,
    keyboardType: 'numeric',
  },
];

export const SAVINGS_FIELD_CONFIGS: Omit<FormField, 'leftIcon'>[] = [
  { key: 'name', type: 'input', placeholder: savings.form.name.placeholder },
  { key: 'type', type: 'dropdown', placeholder: savings.form.type.placeholder, options: SavingsTypeOptions },
  {
    key: 'targetAmount',
    type: 'input',
    label: savings.form.targetAmount.label,
    placeholder: savings.form.targetAmount.placeholder,
    keyboardType: 'numeric',
  },
];

export const FIXED_EXPENSE_STEP_CONFIG: StepConfig = {
  strings: {
    heading: fixedExpenses.heading,
    subheading: fixedExpenses.subheading,
    addButton: fixedExpenses.addButton,
    continueButton: fixedExpenses.continueButton,
    skipButton: fixedExpenses.skipButton,
    form: { addButton: fixedExpenses.form.addButton, cancelButton: fixedExpenses.form.cancelButton },
  },
  initialFormData: { name: '', type: '', amount: '', dayOfMonth: '' },
  validationSchema: fixedExpenseSchema,
  customTypeModal: {
    title: fixedExpenses.customTypeModal.title,
    placeholder: fixedExpenses.customTypeModal.placeholder,
    addButton: fixedExpenses.customTypeModal.addButton,
    cancelButton: fixedExpenses.customTypeModal.cancelButton,
  },
};

export const DEBT_STEP_CONFIG: StepConfig = {
  strings: {
    heading: debts.heading,
    subheading: debts.subheading,
    addButton: debts.addButton,
    continueButton: debts.continueButton,
    skipButton: debts.skipButton,
    form: { addButton: debts.form.addButton, cancelButton: debts.form.cancelButton },
  },
  initialFormData: { name: '', type: '', principal: '', interestRate: '', tenureMonths: '' },
  validationSchema: debtSchema,
  customTypeModal: {
    title: debts.customTypeModal.title,
    placeholder: debts.customTypeModal.placeholder,
    addButton: debts.customTypeModal.addButton,
    cancelButton: debts.customTypeModal.cancelButton,
  },
};

export const SAVINGS_STEP_CONFIG: StepConfig = {
  strings: {
    heading: savings.heading,
    subheading: savings.subheading,
    addButton: savings.addButton,
    continueButton: savings.continueButton,
    skipButton: savings.skipButton,
    form: { addButton: savings.form.addButton, cancelButton: savings.form.cancelButton },
  },
  initialFormData: { name: '', type: '', targetAmount: '' },
  validationSchema: savingsGoalSchema,
  customTypeModal: {
    title: savings.customTypeModal.title,
    placeholder: savings.customTypeModal.placeholder,
    addButton: savings.customTypeModal.addButton,
    cancelButton: savings.customTypeModal.cancelButton,
  },
};

export const parseFixedExpenseFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  amount: parseFloat(data.amount) || 0,
  dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth, 10) : null,
});

export const parseDebtFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  principal: parseFloat(data.principal) || 0,
  interestRate: parseFloat(data.interestRate) || 0,
  tenureMonths: parseInt(data.tenureMonths, 10) || 0,
});

export const parseSavingsFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  targetAmount: parseFloat(data.targetAmount) || 0,
});

/**
 * Create form fields with currency icon for amount fields
 */
export function createFormFieldsWithCurrency(
  configs: Omit<FormField, 'leftIcon'>[],
  currencyIcon: ReactNode,
  currencyFieldKeys: string[] = ['amount', 'principal', 'targetAmount']
): FormField[] {
  return configs.map((config) => ({
    ...config,
    leftIcon: currencyFieldKeys.includes(config.key) ? currencyIcon : undefined,
  }));
}

export const PROFILE_STEP_STRINGS = {
  heading: profileStrings.heading,
  subheading: profileStrings.subheading,
  screenTitle: profileStrings.screenTitle,
  continueButton: profileStrings.continueButton,
};

export { common, profileSchema };
