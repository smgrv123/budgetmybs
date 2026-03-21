import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import type { AmountDue } from '@/db/schema-types';
import { CreditCardTxnTypeEnum } from '@/db/types';
import { CreditCardPreviewCard, PayBillModal } from '@/src/components/credit-cards';
import { ActiveFilterChips, TransactionCard, TransactionFilterModal } from '@/src/components/transaction';
import { BButton, BIcon, BLink, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import {
  CREDIT_CARD_DATE_FORMATS,
  CREDIT_CARD_PROVIDER_COLORS,
  CREDIT_CARD_PROVIDER_ICONS,
  CREDIT_CARD_PROVIDER_OPTIONS,
} from '@/src/constants/credit-cards.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { ALL_TRANSACTIONS_STRINGS } from '@/src/constants/transactions.strings';
import { useAllExpenses, useCategories, useCreditCards } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ExpenseFilter, TransactionListItem } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER, ExpenseFilterType } from '@/src/types';
import { formatDate } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/format';

const DEFAULT_AMOUNT_DUE: AmountDue = { carried: 0, newPurchases: 0, total: 0 };

export default function CreditCardDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const cardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const themeColors = useThemeColors();
  const { creditCards, creditCardSummaries, isCreditCardsLoading } = useCreditCards();
  const { allCategories } = useCategories();
  const [isPayBillVisible, setIsPayBillVisible] = useState(false);

  // Filter state — creditCardId is always scoped to this card via mergedFilter
  const [appliedFilter, setAppliedFilter] = useState<ExpenseFilter>(DEFAULT_EXPENSE_FILTER);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Merge user filters with the card scope
  const mergedFilter = { ...appliedFilter, creditCardId: cardId ?? null };

  const {
    items,
    isLoading: isExpensesLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllExpenses(mergedFilter);

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

  // hasActiveFilter ignores creditCardId since it's always set on this screen
  const hasActiveFilter =
    appliedFilter.categoryId !== null ||
    appliedFilter.startDate !== '' ||
    appliedFilter.endDate !== '' ||
    appliedFilter.type !== ExpenseFilterType.ALL;

  const handleApply = (filter: ExpenseFilter) => {
    setAppliedFilter(filter);
    setFilterModalVisible(false);
  };

  const handleClear = () => {
    setAppliedFilter(DEFAULT_EXPENSE_FILTER);
    setFilterModalVisible(false);
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
  const amountDue = summary?.amountDue ?? DEFAULT_AMOUNT_DUE;

  const renderItem = ({ item }: { item: TransactionListItem }) => {
    if (item.type === 'sectionHeader') {
      return (
        <BView
          row
          align="center"
          justify="space-between"
          paddingX={SpacingValue.LG}
          paddingY={SpacingValue.SM}
          style={{ backgroundColor: themeColors.backgroundSecondary }}
        >
          <BText variant={TextVariant.LABEL}>{item.title}</BText>
          <BText variant={TextVariant.CAPTION} muted>
            {formatCurrency(item.total)}
          </BText>
        </BView>
      );
    }

    const expense = item.data;
    const creditCardColor = expense.creditCard ? CREDIT_CARD_PROVIDER_COLORS[expense.creditCard.provider] : undefined;

    return (
      <BLink href={`/transaction-detail?id=${expense.id}`} fullWidth style={{ paddingVertical: 0 }}>
        <TransactionCard
          id={expense.id}
          description={expense.description}
          amount={expense.amount}
          date={expense.date}
          categoryName={expense.category?.name ?? null}
          categoryIcon={expense.category?.icon ?? null}
          categoryColor={expense.category?.color ?? null}
          savingsType={expense.savingsType}
          isSaving={expense.isSaving === 1}
          isRecurring={Boolean(expense.sourceType)}
          creditCardNickname={expense.creditCard?.nickname ?? null}
          creditCardLast4={expense.creditCard?.last4 ?? null}
          creditCardColor={creditCardColor ?? null}
          isBillPay={expense.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT}
        />
      </BLink>
    );
  };

  const keyExtractor = (item: TransactionListItem) =>
    item.type === 'sectionHeader' ? `header-${item.month}` : item.data.id;

  const renderEmpty = () => (
    <BView flex center paddingY={SpacingValue.XL}>
      <BIcon name="receipt-outline" size="lg" color={themeColors.textMuted} />
      <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.sm }}>
        {hasActiveFilter ? ALL_TRANSACTIONS_STRINGS.noTransactionsFiltered : ALL_TRANSACTIONS_STRINGS.noTransactions}
      </BText>
      {hasActiveFilter && (
        <BButton variant={ButtonVariant.GHOST} onPress={handleClear} style={{ marginTop: Spacing.xs }}>
          <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
            {ALL_TRANSACTIONS_STRINGS.clearFiltersButton}
          </BText>
        </BButton>
      )}
    </BView>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <BView center paddingY={SpacingValue.MD}>
        <ActivityIndicator color={themeColors.primary} />
      </BView>
    );
  };

  const renderListHeader = () => (
    <BView paddingX={SpacingValue.BASE} paddingY={SpacingValue.SM} gap={SpacingValue.MD}>
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
  );

  const filterActions = [
    {
      icon: 'filter-outline',
      onPress: () => setFilterModalVisible(true),
      color: hasActiveFilter ? themeColors.primary : themeColors.textMuted,
    },
  ];

  return (
    <BSafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader title={CREDIT_CARDS_SETTINGS_STRINGS.details.screenTitle} actions={filterActions} />
      </BView>

      {/* Active filter chips */}
      <ActiveFilterChips filter={appliedFilter} onUpdateFilter={setAppliedFilter} categories={allCategories ?? []} />

      {/* Transaction list with card preview as header */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={isExpensesLoading ? null : renderEmpty()}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isExpensesLoading}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
      />

      {/* Sticky pay bill button at bottom */}
      <BView paddingX={SpacingValue.LG} fullWidth paddingY={SpacingValue.SM} style={styles.stickyBottom}>
        <BButton variant={ButtonVariant.PRIMARY} onPress={() => setIsPayBillVisible(true)}>
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {CREDIT_CARDS_SETTINGS_STRINGS.payBillButton}
          </BText>
        </BButton>
      </BView>

      {/* Pay Bill Modal */}
      <PayBillModal
        isVisible={isPayBillVisible}
        onClose={() => setIsPayBillVisible(false)}
        creditCardId={card.id}
        creditCardNickname={card.nickname}
        amountDue={amountDue}
      />

      {/* Filter Modal — no card filter since we're already scoped to one card */}
      <TransactionFilterModal
        isVisible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        appliedFilter={appliedFilter}
        onApply={handleApply}
        onClear={handleClear}
        categories={allCategories ?? []}
        showCardFilter={false}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
    flexGrow: 1,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: Spacing.xl,
  },
});
