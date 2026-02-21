import BListStep from '@/src/components/onboarding/listStep';
import { BText } from '@/src/components/ui';
import { FixedExpenseTypeOptions } from '@/src/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  FIXED_EXPENSE_FIELD_CONFIGS,
  FIXED_EXPENSE_STEP_CONFIG,
  parseFixedExpenseFormData,
} from '@/src/constants/setup-form.config';
import { useOnboardingStore } from '@/src/store';
import { formatIndianNumber } from '@/src/utils/format';

export type FixedExpensesStepProps = {
  onNext: () => void;
};

function FixedExpensesStep({ onNext }: FixedExpensesStepProps) {
  const { fixedExpenses: expenses, addFixedExpense, removeFixedExpense, updateFixedExpense } = useOnboardingStore();

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
        toFormData: (item) => ({
          name: item.name,
          type: item.type,
          amount: formatIndianNumber(item.amount),
          dayOfMonth: item.dayOfMonth ? String(item.dayOfMonth) : '',
        }),
      }}
      onRemoveItem={removeFixedExpense}
      onEditItem={(tempId, data) => updateFixedExpense(tempId, data)}
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
