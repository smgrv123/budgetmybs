import { SavingsTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  parseSavingsFormData,
  SAVINGS_FIELD_CONFIGS,
  SAVINGS_STEP_CONFIG,
} from '@/constants/setup-form.config';
import { BListStep, BText } from '@/src/components';
import { useOnboardingStore } from '@/src/store';

export interface SavingsStepProps {
  onNext: () => void;
}

function SavingsStep({ onNext }: SavingsStepProps) {
  const { savingsGoals, addSavingsGoal, removeSavingsGoal } = useOnboardingStore();

  const getTypeLabel = (type: string) => {
    const option = SavingsTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(SAVINGS_FIELD_CONFIGS, currencyIcon);

  return (
    <BListStep
      strings={SAVINGS_STEP_CONFIG.strings}
      items={savingsGoals}
      itemCardConfig={{
        getTitle: (item) => item.name,
        getSubtitle: (item) => getTypeLabel(item.type),
        getAmount: (item) => item.targetAmount,
      }}
      onRemoveItem={removeSavingsGoal}
      formFields={formFields}
      initialFormData={SAVINGS_STEP_CONFIG.initialFormData}
      validationSchema={SAVINGS_STEP_CONFIG.validationSchema}
      onAddItem={addSavingsGoal}
      parseFormData={parseSavingsFormData}
      onNext={onNext}
      customTypeModal={SAVINGS_STEP_CONFIG.customTypeModal}
    />
  );
}

export default SavingsStep;
