import { useMemo } from 'react';

import BListStep from '@/src/components/onboarding/listStep';
import { BText } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_ICONS, CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { OnboardingStepId } from '@/src/constants/onboarding.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import {
  common,
  createFormFieldsWithCurrency,
  CREDIT_CARD_FIELD_CONFIGS,
  CREDIT_CARD_STEP_CONFIG,
  parseCreditCardFormData,
} from '@/src/constants/setup-form.config';
import { useOnboardingStore } from '@/src/store';
import { formatIndianNumber } from '@/src/utils/format';

export type CreditCardsStepProps = {
  onNext: () => void;
};

function CreditCardsStep({ onNext }: CreditCardsStepProps) {
  const { creditCards, addCreditCard, removeCreditCard, updateCreditCard } = useOnboardingStore();

  const providerLabels = useMemo(() => {
    return new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));
  }, []);

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(CREDIT_CARD_FIELD_CONFIGS, currencyIcon, ['creditLimit']);

  const getSubtitle = (item: (typeof creditCards)[number]) => {
    const providerLabel = providerLabels.get(item.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
    const last4Label = `${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${item.last4}`;
    return [providerLabel, item.bank, last4Label]
      .filter(Boolean)
      .join(CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator);
  };

  return (
    <BListStep
      stepId={OnboardingStepId.CREDIT_CARDS}
      strings={CREDIT_CARD_STEP_CONFIG.strings}
      items={creditCards}
      itemCardConfig={{
        getTitle: (item) => item.nickname,
        getSubtitle,
        getAmount: (item) => item.creditLimit,
        toFormData: (item) => ({
          nickname: item.nickname,
          provider: item.provider,
          bank: item.bank,
          last4: item.last4,
          creditLimit: formatIndianNumber(item.creditLimit),
          statementDayOfMonth: String(item.statementDayOfMonth),
          paymentBufferDays: String(item.paymentBufferDays),
        }),
      }}
      creditCardPreviewProps={(item) => ({
        nickname: item.nickname,
        bank: item.bank,
        providerLabel: providerLabels.get(item.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback,
        providerIcon: CREDIT_CARD_PROVIDER_ICONS[item.provider],
        last4: item.last4,
        usedAmount: 0,
        creditLimit: item.creditLimit,
        dueDateLabel: CREDIT_CARDS_SETTINGS_STRINGS.preview.dueFallback,
      })}
      onRemoveItem={removeCreditCard}
      onEditItem={(tempId, data) => updateCreditCard(tempId, data)}
      formFields={formFields}
      initialFormData={CREDIT_CARD_STEP_CONFIG.initialFormData}
      validationSchema={CREDIT_CARD_STEP_CONFIG.validationSchema}
      onAddItem={addCreditCard}
      parseFormData={parseCreditCardFormData}
      onNext={onNext}
    />
  );
}

export default CreditCardsStep;
