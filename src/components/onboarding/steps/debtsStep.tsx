import { DebtTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  DEBT_FIELD_CONFIGS,
  DEBT_STEP_CONFIG,
  parseDebtFormData,
} from '@/constants/setup-form.config';
import { Colors, Spacing } from '@/constants/theme';
import { BListStep, BText, BView } from '@/src/components';
import { calculateEMI, useOnboardingStore } from '@/src/store';

export interface DebtsStepProps {
  onNext: () => void;
}

function DebtsStep({ onNext }: DebtsStepProps) {
  const { debts: debtsList, addDebt, removeDebt } = useOnboardingStore();

  const getTypeLabel = (type: string) => {
    const option = DebtTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(DEBT_FIELD_CONFIGS, currencyIcon, ['principal']);

  return (
    <BListStep
      strings={DEBT_STEP_CONFIG.strings}
      items={debtsList}
      itemCardConfig={{
        getTitle: (item) => item.name,
        getSubtitle: (item) => getTypeLabel(item.type),
        getAmount: (item) => item.principal,
        getSecondaryAmount: (item) => calculateEMI(item.principal, item.interestRate, item.tenureMonths),
        secondaryLabel: 'EMI',
      }}
      onRemoveItem={removeDebt}
      formFields={formFields}
      initialFormData={DEBT_STEP_CONFIG.initialFormData}
      validationSchema={DEBT_STEP_CONFIG.validationSchema}
      onAddItem={addDebt}
      parseFormData={parseDebtFormData}
      onNext={onNext}
      extraFormContent={(formData) => {
        const emi =
          formData.principal && formData.interestRate && formData.tenureMonths
            ? calculateEMI(
                parseFloat(formData.principal) || 0,
                parseFloat(formData.interestRate) || 0,
                parseInt(formData.tenureMonths, 10) || 0
              )
            : 0;
        return emi > 0 ? (
          <BView row gap="sm" style={{ marginTop: Spacing.sm }}>
            <BText variant="label" muted>
              EMI:
            </BText>
            <BText variant="subheading" color={Colors.light.primary}>
              {common.currency} {emi.toLocaleString('en-IN')}
            </BText>
          </BView>
        ) : null;
      }}
      customTypeModal={DEBT_STEP_CONFIG.customTypeModal}
    />
  );
}

export default DebtsStep;
