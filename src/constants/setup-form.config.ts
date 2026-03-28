import { ReactNode } from 'react';
import type { ZodType } from 'zod';

import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import {
  DebtTypeOptions,
  FixedExpenseTypeOptions,
  IncomeTypeOptions,
  SavingsTypeOptions,
} from '@/src/constants/onboarding.config';
import { OnboardingStrings } from '@/src/constants/onboarding.strings';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import type { FormField } from '@/src/types';
import { parseFormattedNumber } from '@/src/utils/format';
import { creditCardSchema } from '@/src/validation/credit-cards';
import {
  debtSchema,
  fixedExpenseSchema,
  incomeSchema,
  profileSchema,
  savingsGoalSchema,
} from '@/src/validation/onboarding';

const { profile: profileStrings, fixedExpenses, debts, income, savings, common } = OnboardingStrings;
const creditCardProviderFieldOptions = CREDIT_CARD_PROVIDER_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

export type ProfileFieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  helperText?: string;
  icon?: string;
  hasCurrencyIcon?: boolean;
};

export type StepConfig = {
  strings: {
    heading: string;
    subheading: string;
    addButton: string;
    continueButton: string;
    skipButton: string;
    form: { addButton: string; cancelButton: string; saveButton: string; cancelEditButton: string };
  };
  initialFormData: Record<string, string>;
  validationSchema: ZodType;
  customTypeModal?: {
    title: string;
    placeholder: string;
    addButton: string;
    cancelButton: string;
  };
};

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
    helperText: fixedExpenses.form.dayOfMonth.helperText,
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
  {
    key: 'dayOfMonth',
    type: 'input',
    placeholder: debts.form.dayOfMonth.placeholder,
    keyboardType: 'numeric',
    helperText: debts.form.dayOfMonth.helperText,
  },
];

export const INCOME_FIELD_CONFIGS: Omit<FormField, 'leftIcon'>[] = [
  {
    key: 'amount',
    type: 'input',
    placeholder: income.form.amount.placeholder,
    keyboardType: 'numeric',
  },
  {
    key: 'type',
    type: 'dropdown',
    placeholder: income.form.type.placeholder,
    options: IncomeTypeOptions,
  },
  {
    key: 'description',
    type: 'input',
    placeholder: income.form.description.placeholder,
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

export const CREDIT_CARD_FIELD_CONFIGS: Omit<FormField, 'leftIcon'>[] = [
  {
    key: 'nickname',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.nickname,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.nickname,
  },
  {
    key: 'provider',
    type: 'dropdown',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.provider,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.provider,
    options: creditCardProviderFieldOptions,
  },
  {
    key: 'bank',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.bank,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.bank,
  },
  {
    key: 'last4',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.last4,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.last4,
    keyboardType: 'numeric',
  },
  {
    key: 'creditLimit',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.creditLimit,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.creditLimit,
    keyboardType: 'numeric',
  },
  {
    key: 'statementDayOfMonth',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.statementDay,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.statementDay,
    keyboardType: 'numeric',
  },
  {
    key: 'paymentBufferDays',
    type: 'input',
    label: CREDIT_CARDS_SETTINGS_STRINGS.form.labels.paymentBufferDays,
    placeholder: CREDIT_CARDS_SETTINGS_STRINGS.form.placeholders.paymentBufferDays,
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
    form: {
      addButton: fixedExpenses.form.addButton,
      cancelButton: fixedExpenses.form.cancelButton,
      saveButton: fixedExpenses.form.saveButton,
      cancelEditButton: fixedExpenses.form.cancelEditButton,
    },
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
    form: {
      addButton: debts.form.addButton,
      cancelButton: debts.form.cancelButton,
      saveButton: debts.form.saveButton,
      cancelEditButton: debts.form.cancelEditButton,
    },
  },
  initialFormData: { name: '', type: '', principal: '', interestRate: '', tenureMonths: '', dayOfMonth: '' },
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
    form: {
      addButton: savings.form.addButton,
      cancelButton: savings.form.cancelButton,
      saveButton: savings.form.saveButton,
      cancelEditButton: savings.form.cancelEditButton,
    },
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

export const INCOME_STEP_CONFIG: StepConfig = {
  strings: {
    heading: income.heading,
    subheading: income.subheading,
    addButton: income.addButton,
    continueButton: income.continueButton,
    skipButton: income.skipButton,
    form: {
      addButton: income.form.addButton,
      cancelButton: income.form.cancelButton,
      saveButton: income.form.saveButton,
      cancelEditButton: income.form.cancelEditButton,
    },
  },
  initialFormData: { amount: '', type: '', description: '' },
  validationSchema: incomeSchema,
  customTypeModal: {
    title: income.customTypeModal.title,
    placeholder: income.customTypeModal.placeholder,
    addButton: income.customTypeModal.addButton,
    cancelButton: income.customTypeModal.cancelButton,
  },
};

export const CREDIT_CARD_STEP_CONFIG: StepConfig = {
  strings: {
    heading: CREDIT_CARDS_SETTINGS_STRINGS.listStep.heading,
    subheading: CREDIT_CARDS_SETTINGS_STRINGS.listStep.subheading,
    addButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.addButton,
    continueButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.continueButton,
    skipButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.skipButton,
    form: {
      addButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.form.addButton,
      cancelButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.form.cancelButton,
      saveButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.form.saveButton,
      cancelEditButton: CREDIT_CARDS_SETTINGS_STRINGS.listStep.form.cancelEditButton,
    },
  },
  initialFormData: {
    nickname: '',
    provider: '',
    bank: '',
    last4: '',
    creditLimit: '',
    statementDayOfMonth: '',
    paymentBufferDays: '',
  },
  validationSchema: creditCardSchema,
};

export const parseFixedExpenseFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  amount: parseFormattedNumber(data.amount),
  dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth, 10) : 1,
});

export const parseDebtFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  principal: parseFormattedNumber(data.principal),
  interestRate: parseFloat(data.interestRate) || 0,
  tenureMonths: parseInt(data.tenureMonths, 10) || 0,
  dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth, 10) : 1,
});

export const parseSavingsFormData = (data: Record<string, string>) => ({
  name: data.name,
  type: data.type,
  targetAmount: parseFormattedNumber(data.targetAmount),
});

export const parseIncomeFormData = (data: Record<string, string>) => ({
  amount: parseFormattedNumber(data.amount),
  type: data.type,
  description: data.description || undefined,
});

export const parseCreditCardFormData = (data: Record<string, string>) => ({
  nickname: data.nickname.trim(),
  provider: data.provider,
  bank: data.bank.trim(),
  last4: data.last4.trim(),
  creditLimit: parseFormattedNumber(data.creditLimit),
  statementDayOfMonth: data.statementDayOfMonth ? parseInt(data.statementDayOfMonth, 10) || 0 : 0,
  paymentBufferDays: data.paymentBufferDays ? parseInt(data.paymentBufferDays, 10) || -1 : -1,
});

/**
 * Create form fields with currency icon for amount fields
 */
export function createFormFieldsWithCurrency(
  configs: Omit<FormField, 'leftIcon'>[],
  currencyIcon: ReactNode,
  currencyFieldKeys: string[] = ['amount', 'principal', 'targetAmount', 'creditLimit']
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
