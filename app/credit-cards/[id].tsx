import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';

import { CreditCardPreviewCard } from '@/src/components/credit-cards';
import { BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import {
  CREDIT_CARD_DATE_FORMATS,
  CREDIT_CARD_PROVIDER_ICONS,
  CREDIT_CARD_PROVIDER_OPTIONS,
} from '@/src/constants/credit-cards.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useCreditCards } from '@/src/hooks';
import { formatDate } from '@/src/utils/date';

export default function CreditCardDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const cardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { creditCards, creditCardSummaries, isCreditCardsLoading } = useCreditCards();

  const summaryById = useMemo(() => {
    return new Map(creditCardSummaries.map((summary) => [summary.cardId, summary]));
  }, [creditCardSummaries]);

  const providerLabels = useMemo(() => {
    return new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));
  }, []);

  const card = creditCards.find((item) => item.id === cardId);
  const summary = cardId ? summaryById.get(cardId) : undefined;

  const providerLabel = card
    ? (providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback)
    : CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
  const dueDateLabel = summary?.dueDate
    ? formatDate(summary.dueDate, CREDIT_CARD_DATE_FORMATS.dueDate)
    : CREDIT_CARDS_SETTINGS_STRINGS.preview.dueFallback;

  if (isCreditCardsLoading) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView paddingX="base" paddingY="lg">
          <ScreenHeader title={CREDIT_CARDS_SETTINGS_STRINGS.details.screenTitle} />
          <BText variant={TextVariant.CAPTION} muted>
            {CREDIT_CARDS_SETTINGS_STRINGS.details.loadingLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (!card) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView paddingX="base" paddingY="lg">
          <ScreenHeader title={CREDIT_CARDS_SETTINGS_STRINGS.details.screenTitle} />
          <BText variant={TextVariant.CAPTION} muted>
            {CREDIT_CARDS_SETTINGS_STRINGS.details.notFoundLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  const usedAmount = summary?.usedAmount ?? 0;
  const creditLimit = summary?.creditLimit ?? card.creditLimit;

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: Spacing[SpacingValue.BASE] }}>
        <BView gap={SpacingValue.LG}>
          <ScreenHeader title={CREDIT_CARDS_SETTINGS_STRINGS.details.screenTitle} />

          <CreditCardPreviewCard
            nickname={card.nickname}
            bank={card.bank}
            providerLabel={providerLabel}
            providerIcon={CREDIT_CARD_PROVIDER_ICONS[card.provider]}
            last4={card.last4}
            usedAmount={usedAmount}
            creditLimit={creditLimit}
            dueDateLabel={dueDateLabel}
          />
        </BView>
      </ScrollView>
    </BSafeAreaView>
  );
}
