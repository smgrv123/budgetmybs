import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import type { Category, CreditCard } from '@/db/schema-types';
import { BButton, BDateField, BDropdown, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import {
  ALL_TRANSACTIONS_STRINGS,
  TRANSACTION_COMMON_STRINGS,
  TRANSACTION_FILTER_TYPE_OPTIONS,
  TRANSACTION_VALIDATION_STRINGS,
} from '@/src/constants/transactions.strings';
import { ButtonVariant, ModalPosition, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ExpenseFilter } from '@/src/types';
import { DEFAULT_EXPENSE_FILTER } from '@/src/types';

const dateFilterSchema = z.object({
  startDate: z.union([z.literal(''), z.iso.date(TRANSACTION_VALIDATION_STRINGS.startDateISO)]),
  endDate: z.union([z.literal(''), z.iso.date(TRANSACTION_VALIDATION_STRINGS.endDateISO)]),
});

export interface TransactionFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  appliedFilter: ExpenseFilter;
  onApply: (filter: ExpenseFilter) => void;
  onClear: () => void;
  categories: Category[];
  creditCards?: CreditCard[];
  showCardFilter?: boolean;
}

const TransactionFilterModal: FC<TransactionFilterModalProps> = ({
  isVisible,
  onClose,
  appliedFilter,
  onApply,
  onClear,
  categories,
  creditCards = [],
  showCardFilter = true,
}) => {
  const themeColors = useThemeColors();
  const [draftFilter, setDraftFilter] = useState<ExpenseFilter>(appliedFilter);
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string }>({});

  // Sync draft to applied when modal opens
  useEffect(() => {
    if (isVisible) {
      setDraftFilter(appliedFilter);
      setDateErrors({});
    }
  }, [isVisible, appliedFilter]);

  const categoryOptions = useMemo(
    () => [
      { label: ALL_TRANSACTIONS_STRINGS.categoryPlaceholder, value: '' },
      ...categories.map((c) => ({ label: c.name, value: c.id })),
    ],
    [categories]
  );

  const providerLabels = useMemo(() => new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((opt) => [opt.value, opt.label])), []);

  const creditCardOptions = useMemo(
    () => [
      { label: ALL_TRANSACTIONS_STRINGS.cardPlaceholder, value: '' },
      ...creditCards.map((card) => {
        const provider = providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
        const base = `${card.nickname}${CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator}${provider}${CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator}${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${card.last4}`;
        const label = card.isActive === 0 ? `${base} ${CREDIT_CARDS_SETTINGS_STRINGS.listItem.archivedSuffix}` : base;
        return { label, value: card.id };
      }),
    ],
    [creditCards, providerLabels]
  );

  const handleApply = () => {
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
    onApply(draftFilter);
  };

  const handleClear = () => {
    setDraftFilter(DEFAULT_EXPENSE_FILTER);
    setDateErrors({});
    onClear();
  };

  return (
    <BModal
      isVisible={isVisible}
      onClose={onClose}
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

        {/* Credit Card */}
        {showCardFilter && creditCards.length > 0 && (
          <BDropdown
            label={ALL_TRANSACTIONS_STRINGS.cardLabel}
            options={creditCardOptions}
            value={draftFilter.creditCardId ?? ''}
            onValueChange={(v) => setDraftFilter((f) => ({ ...f, creditCardId: v === '' ? null : String(v) }))}
            placeholder={ALL_TRANSACTIONS_STRINGS.cardPlaceholder}
            modalTitle={ALL_TRANSACTIONS_STRINGS.cardModalTitle}
            searchable
          />
        )}

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
          <BButton style={{ flex: 1 }} variant={ButtonVariant.OUTLINE} onPress={handleClear} paddingY={SpacingValue.MD}>
            <BText variant={TextVariant.LABEL} color={themeColors.primary}>
              {ALL_TRANSACTIONS_STRINGS.clearAllButton}
            </BText>
          </BButton>
          <BButton style={{ flex: 1 }} variant={ButtonVariant.PRIMARY} onPress={handleApply} paddingY={SpacingValue.MD}>
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {ALL_TRANSACTIONS_STRINGS.applyButton}
            </BText>
          </BButton>
        </BView>
      </BView>
    </BModal>
  );
};

export default TransactionFilterModal;
