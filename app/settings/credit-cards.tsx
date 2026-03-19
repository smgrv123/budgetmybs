import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import type { CreditCardProvider } from '@/db/types';
import BListStep from '@/src/components/onboarding/listStep';
import { BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import {
  CREDIT_CARD_DATE_FORMATS,
  CREDIT_CARD_PROVIDER_ICONS,
  CREDIT_CARD_PROVIDER_OPTIONS,
} from '@/src/constants/credit-cards.config';
import { OnboardingStepId as SettingId } from '@/src/constants/onboarding.config';
import { CREDIT_CARDS_SETTINGS_STRINGS, SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
import {
  common,
  createFormFieldsWithCurrency,
  CREDIT_CARD_FIELD_CONFIGS,
  CREDIT_CARD_STEP_CONFIG,
  parseCreditCardFormData,
} from '@/src/constants/setup-form.config';
import { useCreditCards } from '@/src/hooks';
import { formatDate } from '@/src/utils/date';
import { formatIndianNumber } from '@/src/utils/format';
import { generateUUID } from '@/src/utils/id';

type CreditCardFormState = {
  tempId: string;
  nickname: string;
  provider: CreditCardProvider;
  bank: string;
  last4: string;
  creditLimit: number;
  statementDayOfMonth: number;
  paymentBufferDays: number;
};

export default function CreditCardsScreen() {
  const router = useRouter();
  const {
    creditCards: dbCards,
    creditCardSummaries,
    isCreditCardsLoading,
    createCreditCardAsync,
    updateCreditCardAsync,
    removeCreditCardAsync,
  } = useCreditCards();

  const [cards, setCards] = useState<CreditCardFormState[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isCreditCardsLoading && dbCards) {
      setCards(
        dbCards.map((card) => ({
          tempId: card.id,
          nickname: card.nickname,
          provider: card.provider,
          bank: card.bank,
          last4: card.last4,
          creditLimit: card.creditLimit,
          statementDayOfMonth: card.statementDayOfMonth,
          paymentBufferDays: card.paymentBufferDays,
        }))
      );
    }
  }, [isCreditCardsLoading, dbCards]);

  const summaryById = useMemo(() => {
    return new Map(creditCardSummaries.map((summary) => [summary.cardId, summary]));
  }, [creditCardSummaries]);

  const providerLabels = useMemo(() => {
    return new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));
  }, []);

  const addCard = (card: Omit<CreditCardFormState, 'tempId'>) => {
    setCards((prev) => [...prev, { ...card, tempId: generateUUID() }]);
  };

  const updateCard = (tempId: string, data: Partial<CreditCardFormState>) => {
    setCards((prev) => prev.map((card) => (card.tempId === tempId ? { ...card, ...data } : card)));
  };

  const removeCard = (tempId: string) => {
    setCards((prev) => prev.filter((card) => card.tempId !== tempId));
  };

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbCards?.find((card) => card.id === tempId);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeCard(tempId);
  };

  const handleSaveChanges = async () => {
    const dbIds = new Set((dbCards || []).map((card) => card.id));

    const addedItems = cards.filter((item) => !dbIds.has(item.tempId));
    const updatedItems = cards.filter((item) => {
      if (!dbIds.has(item.tempId)) return false;
      const original = dbCards?.find((card) => card.id === item.tempId);
      if (!original) return false;
      return (
        original.nickname !== item.nickname ||
        original.provider !== item.provider ||
        original.bank !== item.bank ||
        original.last4 !== item.last4 ||
        original.creditLimit !== item.creditLimit ||
        original.statementDayOfMonth !== item.statementDayOfMonth ||
        original.paymentBufferDays !== item.paymentBufferDays
      );
    });

    const operations = [
      ...addedItems.map((item) =>
        createCreditCardAsync(
          {
            nickname: item.nickname,
            provider: item.provider,
            bank: item.bank,
            last4: item.last4,
            creditLimit: item.creditLimit,
            statementDayOfMonth: item.statementDayOfMonth,
            paymentBufferDays: item.paymentBufferDays,
          },
          {
            onError: (error) => console.error(CREDIT_CARDS_SETTINGS_STRINGS.logs.createFailed, error),
          }
        )
      ),
      ...updatedItems.map((item) =>
        updateCreditCardAsync(
          {
            id: item.tempId,
            data: {
              nickname: item.nickname,
              provider: item.provider,
              bank: item.bank,
              last4: item.last4,
              creditLimit: item.creditLimit,
              statementDayOfMonth: item.statementDayOfMonth,
              paymentBufferDays: item.paymentBufferDays,
            },
          },
          {
            onError: (error) => console.error(CREDIT_CARDS_SETTINGS_STRINGS.logs.updateFailed, error),
          }
        )
      ),
      ...removedItemIds.map((id) =>
        removeCreditCardAsync(id, {
          onError: (error) => console.error(CREDIT_CARDS_SETTINGS_STRINGS.logs.removeFailed, error),
        })
      ),
    ];

    const results = await Promise.allSettled(operations);
    const hasError = results.some((result) => result.status === 'rejected');

    if (hasError) {
      Alert.alert(SETTINGS_COMMON_STRINGS.errorAlertTitle, SETTINGS_COMMON_STRINGS.saveChangesFailed);
      return;
    }

    router.back();
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(CREDIT_CARD_FIELD_CONFIGS, currencyIcon, ['creditLimit']);

  const getSubtitle = (item: CreditCardFormState) => {
    const providerLabel = providerLabels.get(item.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
    const last4Label = `${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${item.last4}`;
    return [providerLabel, item.bank, last4Label]
      .filter(Boolean)
      .join(CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator);
  };

  const getPreviewProps = (item: CreditCardFormState) => {
    const summary = summaryById.get(item.tempId);
    const providerLabel = providerLabels.get(item.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
    const dueDateLabel = summary?.dueDate
      ? formatDate(summary.dueDate, CREDIT_CARD_DATE_FORMATS.dueDate)
      : CREDIT_CARDS_SETTINGS_STRINGS.preview.dueFallback;

    return {
      nickname: item.nickname,
      bank: item.bank,
      providerLabel,
      providerIcon: CREDIT_CARD_PROVIDER_ICONS[item.provider],
      last4: item.last4,
      usedAmount: summary?.usedAmount ?? 0,
      creditLimit: summary?.creditLimit ?? item.creditLimit,
      dueDateLabel,
    };
  };

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={CREDIT_CARDS_SETTINGS_STRINGS.screenTitle} />

      <BView flex padding="base">
        <BListStep
          stepId={SettingId.CREDIT_CARDS}
          strings={CREDIT_CARD_STEP_CONFIG.strings}
          items={cards}
          itemCardConfig={{
            getTitle: (item) => item.nickname,
            getSubtitle,
            getAmount: (item) => summaryById.get(item.tempId)?.usedAmount ?? 0,
            getSecondaryAmount: (item) => summaryById.get(item.tempId)?.creditLimit ?? item.creditLimit,
            secondaryLabel: CREDIT_CARDS_SETTINGS_STRINGS.limitLabel,
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
          creditCardPreviewProps={getPreviewProps}
          onRemoveItem={handleRemoveItem}
          onEditItem={(tempId, data) => updateCard(tempId, data)}
          formFields={formFields}
          initialFormData={CREDIT_CARD_STEP_CONFIG.initialFormData}
          validationSchema={CREDIT_CARD_STEP_CONFIG.validationSchema}
          onAddItem={addCard}
          parseFormData={parseCreditCardFormData}
          onNext={handleSaveChanges}
          nextButtonLabel={SETTINGS_COMMON_STRINGS.saveChangesButton}
        />
      </BView>
    </BSafeAreaView>
  );
}
