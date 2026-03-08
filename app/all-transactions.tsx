import { TransactionCard } from '@/src/components/transaction';
import {
  BButton,
  BDateField,
  BDropdown,
  BIcon,
  BLink,
  BModal,
  BSafeAreaView,
  BText,
  BView,
  FilterChip,
  ScreenHeader,
} from '@/src/components/ui';
import {
  ALL_TRANSACTIONS_STRINGS,
  TRANSACTION_COMMON_STRINGS,
  TRANSACTION_FILTER_TYPE_OPTIONS,
  TRANSACTION_VALIDATION_STRINGS,
} from '@/src/constants/transactions.strings';
import { ButtonVariant, ModalPosition, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useAllExpenses, useCategories } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ExpenseFilter } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER, ExpenseFilterType } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { z } from 'zod';

// ─── Date filter validation ─────────────────────────────────────────────────
const dateFilterSchema = z.object({
  startDate: z.union([z.literal(''), z.iso.date(TRANSACTION_VALIDATION_STRINGS.startDateISO)]),
  endDate: z.union([z.literal(''), z.iso.date(TRANSACTION_VALIDATION_STRINGS.endDateISO)]),
});

export default function AllTransactionsScreen() {
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();

  // ─── Filter state ────────────────────────────────────────────────────────────
  const [appliedFilter, setAppliedFilter] = useState<ExpenseFilter>(DEFAULT_EXPENSE_FILTER);
  const [draftFilter, setDraftFilter] = useState<ExpenseFilter>(DEFAULT_EXPENSE_FILTER);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string }>({});

  // ─── Data ─────────────────────────────────────────────────────────────────────
  const { sections, hasActiveFilter, isLoading, isError, refetch } = useAllExpenses(appliedFilter);

  // ─── Category dropdown options ────────────────────────────────────────────────
  const categoryOptions = useMemo(
    () => [
      { label: ALL_TRANSACTIONS_STRINGS.categoryPlaceholder, value: '' },
      ...(allCategories ?? []).map((c) => ({ label: c.name, value: c.id })),
    ],
    [allCategories]
  );

  // ─── Modal handlers ───────────────────────────────────────────────────────────
  const openFilter = () => {
    setDraftFilter(appliedFilter);
    setDateErrors({});
    setFilterModalVisible(true);
  };

  const applyFilter = () => {
    // Validate date fields via Zod
    const result = dateFilterSchema.safeParse({
      startDate: draftFilter.startDate,
      endDate: draftFilter.endDate,
    });

    if (!result.success) {
      const fieldErrors: { startDate?: string; endDate?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'startDate' | 'endDate';
        fieldErrors[field] = issue.message;
      }
      setDateErrors(fieldErrors);
      return;
    }

    if (draftFilter.startDate && draftFilter.endDate && draftFilter.startDate > draftFilter.endDate) {
      setDateErrors({ endDate: TRANSACTION_VALIDATION_STRINGS.dateRange });
      return;
    }

    setDateErrors({});
    setAppliedFilter(draftFilter);
    setFilterModalVisible(false);
  };

  const clearFilter = () => {
    setDraftFilter(DEFAULT_EXPENSE_FILTER);
    setAppliedFilter(DEFAULT_EXPENSE_FILTER);
    setDateErrors({});
    setFilterModalVisible(false);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────────
  const renderSectionHeader = ({ section }: { section: (typeof sections)[0] }) => (
    <BView
      row
      align="center"
      justify="space-between"
      paddingX={SpacingValue.LG}
      paddingY={SpacingValue.SM}
      style={{ backgroundColor: themeColors.backgroundSecondary }}
    >
      <BText variant={TextVariant.LABEL}>{section.title}</BText>
      <BText variant={TextVariant.CAPTION} muted>
        {formatCurrency(section.total)}
      </BText>
    </BView>
  );

  const renderItem = ({ item }: { item: (typeof sections)[0]['data'][0] }) => (
    <BLink href={`/transaction-detail?id=${item.id}`} fullWidth style={{ paddingVertical: 0 }}>
      <TransactionCard
        id={item.id}
        description={item.description}
        amount={item.amount}
        date={item.date}
        categoryName={item.category?.name ?? null}
        categoryIcon={item.category?.icon ?? null}
        categoryColor={item.category?.color ?? null}
        savingsType={item.savingsType}
        isSaving={item.isSaving === 1}
        isRecurring={Boolean(item.sourceType)}
      />
    </BLink>
  );

  const renderEmpty = () => (
    <BView flex center paddingY={SpacingValue.XL}>
      <BIcon name="receipt-outline" size="lg" color={themeColors.textMuted} />
      <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.sm }}>
        {hasActiveFilter ? ALL_TRANSACTIONS_STRINGS.noTransactionsFiltered : ALL_TRANSACTIONS_STRINGS.noTransactions}
      </BText>
      {hasActiveFilter && (
        <BButton variant={ButtonVariant.GHOST} onPress={clearFilter} style={{ marginTop: Spacing.xs }}>
          <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
            {ALL_TRANSACTIONS_STRINGS.clearFiltersButton}
          </BText>
        </BButton>
      )}
    </BView>
  );

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      {/* Header */}
      <BView row align="center" justify="space-between" paddingX={SpacingValue.LG}>
        <BView flex>
          <ScreenHeader title={ALL_TRANSACTIONS_STRINGS.screenTitle} titleVariant={TextVariant.SUBHEADING} />
        </BView>
        {!isError && (
          <BButton variant={ButtonVariant.GHOST} onPress={openFilter} padding={SpacingValue.XS}>
            <BIcon
              name="filter-outline"
              size="base"
              color={hasActiveFilter ? themeColors.primary : themeColors.textMuted}
            />
          </BButton>
        )}
      </BView>

      {/* Error state — hide filter chips, show retry */}
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
          {/* Active filter chips */}
          {hasActiveFilter && (
            <BView
              row
              gap={SpacingValue.XS}
              paddingX={SpacingValue.LG}
              paddingY={SpacingValue.XS}
              style={{ flexWrap: 'wrap' }}
            >
              {appliedFilter.type !== ExpenseFilterType.ALL && (
                <FilterChip
                  label={
                    appliedFilter.type === ExpenseFilterType.EXPENSE
                      ? ALL_TRANSACTIONS_STRINGS.expensesOnlyChip
                      : ALL_TRANSACTIONS_STRINGS.savingsOnlyChip
                  }
                  onRemove={() => setAppliedFilter((f) => ({ ...f, type: ExpenseFilterType.ALL }))}
                />
              )}
              {appliedFilter.categoryId && (
                <FilterChip
                  icon="pricetag-outline"
                  label={
                    allCategories?.find((c) => c.id === appliedFilter.categoryId)?.name ??
                    TRANSACTION_COMMON_STRINGS.categoryFallback
                  }
                  onRemove={() => setAppliedFilter((f) => ({ ...f, categoryId: null }))}
                />
              )}
              {(appliedFilter.startDate || appliedFilter.endDate) && (
                <FilterChip
                  icon="calendar-outline"
                  label={[appliedFilter.startDate, appliedFilter.endDate].filter(Boolean).join(' – ')}
                  onRemove={() => setAppliedFilter((f) => ({ ...f, startDate: '', endDate: '' }))}
                />
              )}
            </BView>
          )}

          {/* Transactions SectionList */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={isLoading ? null : renderEmpty()}
            stickySectionHeadersEnabled
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        </>
      )}

      {/* Filter Modal */}
      <BModal
        isVisible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title={ALL_TRANSACTIONS_STRINGS.filterModalTitle}
        position={ModalPosition.BOTTOM}
      >
        <BView gap={SpacingValue.MD} paddingX={SpacingValue.LG} paddingY={SpacingValue.MD}>
          {/* Category */}
          <BDropdown
            label={ALL_TRANSACTIONS_STRINGS.categoryLabel}
            options={categoryOptions}
            value={draftFilter.categoryId ?? ''}
            onValueChange={(v) => setDraftFilter((f) => ({ ...f, categoryId: v === '' ? null : String(v) }))}
            placeholder={ALL_TRANSACTIONS_STRINGS.categoryPlaceholder}
            modalTitle={ALL_TRANSACTIONS_STRINGS.categoryModalTitle}
            searchable
          />

          {/* Date range */}
          <BView row gap={SpacingValue.SM}>
            <BView flex>
              <BDateField
                label={ALL_TRANSACTIONS_STRINGS.fromLabel}
                value={draftFilter.startDate}
                onChange={(v) => {
                  setDraftFilter((f) => ({ ...f, startDate: v }));
                  if (dateErrors.startDate) setDateErrors((e) => ({ ...e, startDate: undefined }));
                  if (dateErrors.endDate) setDateErrors((e) => ({ ...e, endDate: undefined }));
                }}
                placeholder={TRANSACTION_COMMON_STRINGS.datePlaceholderISO}
                error={dateErrors.startDate}
                maximumDate={draftFilter.endDate || undefined}
                allowClear
              />
            </BView>
            <BView flex>
              <BDateField
                label={ALL_TRANSACTIONS_STRINGS.toLabel}
                value={draftFilter.endDate}
                onChange={(v) => {
                  setDraftFilter((f) => ({ ...f, endDate: v }));
                  if (dateErrors.endDate) setDateErrors((e) => ({ ...e, endDate: undefined }));
                }}
                placeholder={TRANSACTION_COMMON_STRINGS.datePlaceholderISO}
                error={dateErrors.endDate}
                minimumDate={draftFilter.startDate || undefined}
                allowClear
              />
            </BView>
          </BView>

          {/* Type toggle */}
          <BView>
            <BText variant={TextVariant.LABEL} style={{ marginBottom: Spacing.xs }}>
              {ALL_TRANSACTIONS_STRINGS.filterTypeLabel}
            </BText>
            <BView row gap={SpacingValue.SM}>
              {TRANSACTION_FILTER_TYPE_OPTIONS.map((opt) => (
                <BButton
                  key={opt.value}
                  style={{ flex: 1 }}
                  variant={draftFilter.type === opt.value ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE}
                  onPress={() => setDraftFilter((f) => ({ ...f, type: opt.value }))}
                  paddingY={SpacingValue.SM}
                >
                  <BText
                    variant={TextVariant.CAPTION}
                    color={draftFilter.type === opt.value ? themeColors.white : themeColors.text}
                  >
                    {opt.label}
                  </BText>
                </BButton>
              ))}
            </BView>
          </BView>

          {/* Actions */}
          <BView row gap={SpacingValue.SM} style={{ marginTop: Spacing.xs }}>
            <BButton
              style={{ flex: 1 }}
              variant={ButtonVariant.OUTLINE}
              onPress={clearFilter}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                {ALL_TRANSACTIONS_STRINGS.clearAllButton}
              </BText>
            </BButton>
            <BButton
              style={{ flex: 1 }}
              variant={ButtonVariant.PRIMARY}
              onPress={applyFilter}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {ALL_TRANSACTIONS_STRINGS.applyButton}
              </BText>
            </BButton>
          </BView>
        </BView>
      </BModal>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
