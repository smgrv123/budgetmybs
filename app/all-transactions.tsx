import { CreditCardTxnTypeEnum } from '@/db/types';
import { ActiveFilterChips, TransactionCard, TransactionFilterModal } from '@/src/components/transaction';
import { BButton, BIcon, BLink, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_COLORS } from '@/src/constants/credit-cards.config';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { ALL_TRANSACTIONS_STRINGS } from '@/src/constants/transactions.strings';
import { useAllExpenses, useCategories, useCreditCards } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ExpenseFilter, TransactionListItem } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

export default function AllTransactionsScreen() {
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards(false);

  const [appliedFilter, setAppliedFilter] = useState<ExpenseFilter>(DEFAULT_EXPENSE_FILTER);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { items, hasActiveFilter, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAllExpenses(appliedFilter);

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
      <BLink href={`/transaction-detail?id=${expense.id}`} fullWidth style={{ paddingVertical: Spacing.none }}>
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

  const filterActions = !isError
    ? [
        {
          icon: 'filter-outline',
          onPress: () => setFilterModalVisible(true),
          color: hasActiveFilter ? themeColors.primary : themeColors.textMuted,
        },
      ]
    : undefined;

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader
          title={ALL_TRANSACTIONS_STRINGS.screenTitle}
          titleVariant={TextVariant.SUBHEADING}
          actions={filterActions}
        />
      </BView>

      {isError ? (
        <BView flex center gap={SpacingValue.MD} paddingX={SpacingValue.LG}>
          <BIcon name="cloud-offline-outline" size="lg" color={themeColors.error} />
          <BText variant={TextVariant.SUBHEADING} style={{ textAlign: 'center' }}>
            {ALL_TRANSACTIONS_STRINGS.loadErrorTitle}
          </BText>
          <BText variant={TextVariant.BODY} muted style={{ textAlign: 'center' }}>
            {ALL_TRANSACTIONS_STRINGS.loadErrorBody}
          </BText>
          <BButton
            variant={ButtonVariant.PRIMARY}
            onPress={() => refetch()}
            paddingX={SpacingValue.XL}
            paddingY={SpacingValue.SM}
            gap={SpacingValue.SM}
          >
            <BIcon name="refresh-outline" size="sm" color={themeColors.white} />
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {ALL_TRANSACTIONS_STRINGS.retryButton}
            </BText>
          </BButton>
        </BView>
      ) : (
        <>
          <ActiveFilterChips
            filter={appliedFilter}
            onUpdateFilter={setAppliedFilter}
            categories={allCategories ?? []}
            creditCards={creditCards}
          />

          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={isLoading ? null : renderEmpty()}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
          />
        </>
      )}

      <TransactionFilterModal
        isVisible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        appliedFilter={appliedFilter}
        onApply={handleApply}
        onClear={handleClear}
        categories={allCategories ?? []}
        creditCards={creditCards}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
