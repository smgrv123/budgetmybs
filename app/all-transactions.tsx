import { TransactionCard } from '@/src/components/transaction';
import {
  BButton,
  BDropdown,
  BIcon,
  BInput,
  BLink,
  BModal,
  BSafeAreaView,
  BText,
  BView,
  FilterChip,
  ScreenHeader,
} from '@/src/components/ui';
import { ButtonVariant, ModalPosition, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useAllExpenses, useCategories } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ExpenseFilter } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { z } from 'zod';

type FilterType = ExpenseFilter['type'];

const TYPE_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Savings', value: 'saving' },
];

// ─── Date filter validation ─────────────────────────────────────────────────
const dateFilterSchema = z.object({
  startDate: z.union([z.literal(''), z.iso.date('Start date must be YYYY-MM-DD')]),
  endDate: z.union([z.literal(''), z.iso.date('End date must be YYYY-MM-DD')]),
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
      { label: 'All Categories', value: '' },
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
        {hasActiveFilter ? 'No transactions match your filters' : 'No transactions yet'}
      </BText>
      {hasActiveFilter && (
        <BButton variant={ButtonVariant.GHOST} onPress={clearFilter} style={{ marginTop: Spacing.xs }}>
          <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
            Clear filters
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
          <ScreenHeader title="All Transactions" titleVariant="subheading" />
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
            Failed to load transactions
          </BText>
          <BText variant={TextVariant.BODY} muted style={{ textAlign: 'center' }}>
            Something went wrong while fetching your data. Please try again.
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
              Retry
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
              {appliedFilter.type !== 'all' && (
                <FilterChip
                  label={appliedFilter.type === 'expense' ? 'Expenses only' : 'Savings only'}
                  onRemove={() => setAppliedFilter((f) => ({ ...f, type: 'all' }))}
                />
              )}
              {appliedFilter.categoryId && (
                <FilterChip
                  icon="pricetag-outline"
                  label={allCategories?.find((c) => c.id === appliedFilter.categoryId)?.name ?? 'Category'}
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
        title="Filter Transactions"
        position={ModalPosition.BOTTOM}
      >
        <BView gap={SpacingValue.MD} paddingX={SpacingValue.LG} paddingY={SpacingValue.MD}>
          {/* Category */}
          <BDropdown
            label="Category"
            options={categoryOptions}
            value={draftFilter.categoryId ?? ''}
            onValueChange={(v) => setDraftFilter((f) => ({ ...f, categoryId: v === '' ? null : String(v) }))}
            placeholder="All Categories"
            modalTitle="Select Category"
            searchable
          />

          {/* Date range */}
          <BView row gap={SpacingValue.SM}>
            <BView flex>
              <BInput
                label="From"
                value={draftFilter.startDate}
                onChangeText={(v) => {
                  setDraftFilter((f) => ({ ...f, startDate: v }));
                  if (dateErrors.startDate) setDateErrors((e) => ({ ...e, startDate: undefined }));
                }}
                placeholder="YYYY-MM-DD"
                error={dateErrors.startDate}
              />
            </BView>
            <BView flex>
              <BInput
                label="To"
                value={draftFilter.endDate}
                onChangeText={(v) => {
                  setDraftFilter((f) => ({ ...f, endDate: v }));
                  if (dateErrors.endDate) setDateErrors((e) => ({ ...e, endDate: undefined }));
                }}
                placeholder="YYYY-MM-DD"
                error={dateErrors.endDate}
              />
            </BView>
          </BView>

          {/* Type toggle */}
          <BView>
            <BText variant={TextVariant.LABEL} style={{ marginBottom: Spacing.xs }}>
              Type
            </BText>
            <BView row gap={SpacingValue.SM}>
              {TYPE_OPTIONS.map((opt) => (
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
                Clear All
              </BText>
            </BButton>
            <BButton
              style={{ flex: 1 }}
              variant={ButtonVariant.PRIMARY}
              onPress={applyFilter}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                Apply
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
