// Onboarding Components
export { default as BAddItemButton } from './addItemButton';
export { default as BFeatureCard } from './featureCard';
export { default as BItemCard } from './itemCard';
export { default as BListStep } from './listStep';
export { default as BOnboardingLayout } from './onboardingLayout';
export { default as BStepIndicator } from './stepIndicator';

// Step Components
export { BDebtsStep, BFixedExpensesStep, BProfileStep, BSavingsStep } from './steps';

// Re-export types
export type { AddItemButtonProps } from './addItemButton';
export type { FeatureCardProps } from './featureCard';
export type { ItemCardProps } from './itemCard';
export type { ListStepProps } from './listStep';
export type { OnboardingLayoutProps } from './onboardingLayout';
export type { StepIndicatorProps } from './stepIndicator';
export type { DebtsStepProps, FixedExpensesStepProps, ProfileStepProps, SavingsStepProps } from './steps';

// Re-export shared types from src/types
export type { CustomTypeModalConfig, FormField, ItemCardConfig, ListStepStrings } from '@/src/types';
