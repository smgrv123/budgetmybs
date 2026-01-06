import { FixedExpenseTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  FIXED_EXPENSE_FIELD_CONFIGS,
  FIXED_EXPENSE_STEP_CONFIG,
  parseFixedExpenseFormData,
} from '@/constants/setup-form.config';
import { BListStep, BText } from '@/src/components';
import { useOnboardingStore } from '@/src/store';

export interface FixedExpensesStepProps {
  onNext: () => void;
}

function FixedExpensesStep({ onNext }: FixedExpensesStepProps) {
  const { fixedExpenses: expenses, addFixedExpense, removeFixedExpense } = useOnboardingStore();

  const getTypeLabel = (type: string) => {
    const option = FixedExpenseTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(FIXED_EXPENSE_FIELD_CONFIGS, currencyIcon);

  return (
    <BListStep
      strings={FIXED_EXPENSE_STEP_CONFIG.strings}
      items={expenses}
      itemCardConfig={{
        getTitle: (item) => item.name,
        getSubtitle: (item) => getTypeLabel(item.type),
        getAmount: (item) => item.amount,
      }}
      onRemoveItem={removeFixedExpense}
      formFields={formFields}
      initialFormData={FIXED_EXPENSE_STEP_CONFIG.initialFormData}
      validationSchema={FIXED_EXPENSE_STEP_CONFIG.validationSchema}
      onAddItem={addFixedExpense}
      parseFormData={parseFixedExpenseFormData}
      onNext={onNext}
      customTypeModal={FIXED_EXPENSE_STEP_CONFIG.customTypeModal}
    />
  );
}

export default FixedExpensesStep;
