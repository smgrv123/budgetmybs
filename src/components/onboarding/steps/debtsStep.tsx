import { useState } from 'react';

import { DEBT_PAYOFF_STRATEGY_CONFIGS, DebtTypeOptions } from '@/src/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  DEBT_FIELD_CONFIGS,
  DEBT_STEP_CONFIG,
  parseDebtFormData,
} from '@/src/constants/setup-form.config';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import type { DebtPayoffPreference } from '@/db/types';
import BListStep from '@/src/components/onboarding/listStep';
import DebtPayoffStrategyModal from '@/src/components/onboarding/modals/debtPayoffStrategyModal';
import { BButton, BIcon, BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useOnboardingStore } from '@/src/store';
import { calculateEMI } from '@/src/utils/budget';
import { formatCurrency, parseFormattedNumber } from '@/src/utils/format';

export type DebtsStepProps = {
  onNext: () => void;
};

function DebtsStep({ onNext }: DebtsStepProps) {
  const themeColors = useThemeColors();
  const { debts: debtsList, addDebt, removeDebt, profile, updateProfileField } = useOnboardingStore();
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<DebtPayoffPreference | null>(null);

  const getTypeLabel = (type: string) => {
    const option = DebtTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(DEBT_FIELD_CONFIGS, currencyIcon, ['principal']);

  const handleStrategySelect = (strategy: DebtPayoffPreference) => {
    updateProfileField('debtPayoffPreference', strategy);
  };

  const handleInfoClick = (strategy: DebtPayoffPreference) => {
    setSelectedStrategy(strategy);
    setShowStrategyModal(true);
  };

  return (
    <>
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
                  parseFormattedNumber(formData.principal),
                  parseFloat(formData.interestRate) || 0,
                  parseInt(formData.tenureMonths, 10) || 0
                )
              : 0;
          return emi > 0 ? (
            <BView row gap={SpacingValue.SM} marginY={SpacingValue.SM}>
              <BText variant={TextVariant.LABEL} muted>
                EMI:
              </BText>
              <BText variant={TextVariant.SUBHEADING} color={themeColors.primary}>
                {formatCurrency(emi)}
              </BText>
            </BView>
          ) : null;
        }}
        customTypeModal={DEBT_STEP_CONFIG.customTypeModal}
        footerContent={
          debtsList.length > 0 ? (
            <BView
              paddingY={SpacingValue.MD}
              bg={themeColors.background}
              style={{ borderTopColor: themeColors.border, borderTopWidth: 1 }}
            >
              <BView row justify="space-between" align="center" marginY={SpacingValue.MD}>
                <BText variant={TextVariant.LABEL}>Payoff Strategy</BText>
              </BView>

              <BView row gap={SpacingValue.BASE}>
                {DEBT_PAYOFF_STRATEGY_CONFIGS.map((config) => {
                  const isSelected = profile.debtPayoffPreference === config.key;

                  return (
                    <BView key={config.key} flex>
                      <BButton
                        variant={isSelected ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE}
                        onPress={() => handleStrategySelect(config.key)}
                        rounded={SpacingValue.BASE}
                        paddingY={SpacingValue.XS}
                        paddingX={SpacingValue.SM}
                        fullWidth
                        style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        <BView row justify="space-between" align="center" fullWidth>
                          <BText variant={TextVariant.LABEL} color={isSelected ? themeColors.white : themeColors.text}>
                            {config.label}
                          </BText>
                          <BButton variant={ButtonVariant.GHOST} onPress={() => handleInfoClick(config.key)}>
                            <BIcon
                              name="information-circle-outline"
                              size={20}
                              color={isSelected ? themeColors.white : themeColors.primary}
                            />
                          </BButton>
                        </BView>

                        <BText
                          variant={TextVariant.CAPTION}
                          color={isSelected ? themeColors.white : themeColors.textMuted}
                        >
                          {config.description}
                        </BText>
                      </BButton>
                    </BView>
                  );
                })}
              </BView>
            </BView>
          ) : null
        }
      />

      <DebtPayoffStrategyModal
        isVisible={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        strategy={selectedStrategy}
      />
    </>
  );
}

export default DebtsStep;
