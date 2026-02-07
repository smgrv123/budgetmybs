import type { OnboardingState } from '@/src/store/onboardingStore';
import type { FinancialPlan } from '@/src/types/financialPlan';

/**
 * Apply AI-suggested changes to the onboarding store
 * This modifies the store in-place before saving to the database
 *
 * @param plan - The AI-generated financial plan with suggested changes
 * @param store - The onboarding store state with update methods
 */
export const applyAISuggestions = (plan: FinancialPlan, store: OnboardingState): void => {
  plan.suggestedChanges.forEach((change) => {
    switch (change.field) {
      case 'monthlySavingsTarget':
        store.updateProfileField('monthlySavingsTarget', change.suggestedValue);
        break;

      case 'frivolousBudget':
        store.updateProfileField('frivolousBudget', change.suggestedValue);
        break;

      case 'fixedExpense':
        if (change.itemId) {
          store.updateFixedExpense(change.itemId, { amount: change.suggestedValue });
        }
        break;

      case 'debt':
        if (change.itemId) {
          // Update principal - this will trigger EMI recalculation in the UI
          store.updateDebt(change.itemId, { principal: change.suggestedValue });
        }
        break;

      case 'savingsGoal':
        if (change.itemId) {
          store.updateSavingsGoal(change.itemId, { targetAmount: change.suggestedValue });
        }
        break;

      default:
        console.warn(`Unknown suggestion field: ${change.field}`);
    }
  });
};
