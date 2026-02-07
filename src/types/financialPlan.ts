/**
 * Financial plan types for Gemini AI integration
 */

import type { BudgetCategory, RecommendationPriority, SuggestedChangeField } from '@/constants/financialPlan';

export type SuggestedChangeFieldType = (typeof SuggestedChangeField)[keyof typeof SuggestedChangeField];

export type SuggestedChange = {
  field: SuggestedChangeFieldType;
  itemId?: string;
  itemName?: string;
  currentValue: number;
  suggestedValue: number;
  reason: string;
  impact: string;
};

export type BudgetCategoryType = (typeof BudgetCategory)[keyof typeof BudgetCategory];

export type BudgetAllocationItem = {
  category: BudgetCategoryType;
  label: string;
  amount: number;
  percentage: number;
};

export type DebtPayoffPlan = {
  debtName: string;
  priority: number;
  currentEMI: number;
  suggestedExtraPayment: number;
  reason: string;
};

export type SavingsPhase = {
  phase: number;
  title: string;
  duration: string;
  monthlyTarget: number;
  actions: string[];
};

export type RecommendationPriorityType = (typeof RecommendationPriority)[keyof typeof RecommendationPriority];

export type AIRecommendation = {
  priority: RecommendationPriorityType;
  title: string;
  description: string;
};

export type HealthScoreWeights = {
  debtToIncomeWeight: number;
  savingsRateWeight: number;
  expenseRatioWeight: number;
  cushionWeight: number;
};

export type FinancialPlan = {
  summary: string;

  // Health scores with weights for BOTH scenarios
  originalHealthScore: number;
  originalHealthScoreWeights: HealthScoreWeights;

  suggestedHealthScore: number;
  suggestedHealthScoreWeights: HealthScoreWeights;

  suggestedChanges: SuggestedChange[];
  budgetAllocation: BudgetAllocationItem[];
  debtPayoffPlan?: DebtPayoffPlan[];
  savingsPhases: SavingsPhase[];
  recommendations: AIRecommendation[];
  keyInsights: string[];
};
