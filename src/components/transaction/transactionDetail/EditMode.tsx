/**
 * EditMode
 *
 * Edit mode for the transaction detail screen.
 * Shows editable amount, details card (category, date, description),
 * an optional "Split with Splitwise" section (Phase 14), and save/cancel buttons.
 */

import type { FC } from 'react';

import type { CreditCardProvider } from '@/db/types';
import { DetailsCard } from '@/src/components';
import { SplitConfig } from '@/src/components/splitwise';
import { BButton, BCard, BIcon, BInput, BSwitch, BText, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_COLORS } from '@/src/constants/credit-cards.config';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { ButtonVariant, CardVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import {
  TRANSACTION_COMMON_STRINGS,
  TRANSACTION_DETAIL_STRINGS,
  TRANSACTION_VALIDATION_STRINGS,
} from '@/src/constants/transactions.strings';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { SplitFormState } from '@/src/types/splitwise-outbound';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';

type EditModeExpense = {
  creditCard: {
    provider: CreditCardProvider;
    nickname: string | null;
    last4: string;
  } | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  date: string;
  description: string | null;
};

export type EditModeProps = {
  expense: EditModeExpense;
  editAmount: string;
  setEditAmount: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editCategoryId: string | null;
  setEditCategoryId: (v: string | null) => void;
  categoryOptions: { label: string; value: string }[];
  splitwiseFieldsDisabled: boolean;
  /** Warning shown when Splitwise fields are locked (offline vs disconnected copy) */
  splitwiseFieldsDisabledMessage?: string;
  isAnySaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isBillPayment: boolean;

  // Retroactive split (Phase 14)
  /** Show the "Split with Splitwise" toggle — unlinked expense + Splitwise connected */
  showSplitToggle: boolean;
  isSplitEnabled: boolean;
  onSplitToggleChange: (value: boolean) => void;
  /** Show the SplitConfig section inline — toggled on (unlinked) or always-on (linked) */
  showSplitConfig: boolean;
  /** True for already-linked expenses — SplitConfig is rendered read-only (reference only, edited on Splitwise) */
  isSplitConfigReadOnly: boolean;
  splitState: SplitFormState;
  onSplitStateChange: (updates: Partial<SplitFormState>) => void;
};

const EditMode: FC<EditModeProps> = ({
  expense,
  editAmount,
  setEditAmount,
  editDescription,
  setEditDescription,
  editDate,
  setEditDate,
  editCategoryId,
  setEditCategoryId,
  categoryOptions,
  splitwiseFieldsDisabled,
  splitwiseFieldsDisabledMessage = TRANSACTION_DETAIL_STRINGS.splitwiseFieldDisabledOffline,
  isAnySaving,
  onSave,
  onCancel,
  isBillPayment,
  showSplitToggle,
  isSplitEnabled,
  onSplitToggleChange,
  showSplitConfig,
  isSplitConfigReadOnly,
  splitState,
  onSplitStateChange,
}) => {
  const themeColors = useThemeColors();

  return (
    <>
      {/* Warning when Splitwise-synced fields are locked (offline or disconnected) */}
      {splitwiseFieldsDisabled && (
        <BView
          row
          align="center"
          gap={SpacingValue.XS}
          paddingX={SpacingValue.SM}
          paddingY={SpacingValue.XS}
          rounded="base"
          style={{ borderWidth: 1, backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }}
        >
          <BIcon name="cloud-offline-outline" size="sm" color={themeColors.warning} />
          <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
            {splitwiseFieldsDisabledMessage}
          </BText>
        </BView>
      )}

      {/* Amount Card */}
      <BCard variant={CardVariant.ELEVATED} style={{ padding: Spacing.lg }}>
        <BText variant={TextVariant.CAPTION} muted>
          {TRANSACTION_DETAIL_STRINGS.amountLabel}
        </BText>
        <BInput
          value={editAmount}
          onChangeText={(text) => setEditAmount(formatIndianNumber(parseFormattedNumber(text)))}
          keyboardType="decimal-pad"
          placeholder={TRANSACTION_COMMON_STRINGS.amountPlaceholder}
          editable={!splitwiseFieldsDisabled}
          leftIcon={
            <BText variant={TextVariant.LABEL} muted>
              {TRANSACTION_COMMON_STRINGS.currencySymbol}
            </BText>
          }
          containerStyle={[{ marginTop: Spacing.xs }, splitwiseFieldsDisabled ? { opacity: 0.5 } : undefined]}
        />
      </BCard>

      {/* Credit Card Attribution — read-only in edit mode too */}
      {expense.creditCard && (
        <BCard variant={CardVariant.ELEVATED} style={{ padding: Spacing.lg }}>
          <BView row align="center" gap={SpacingValue.MD}>
            <BIcon name="card-outline" size="sm" color={themeColors.textMuted} style={{ marginTop: Spacing.xxs }} />
            <BView flex>
              <BText variant={TextVariant.CAPTION} muted>
                {TRANSACTION_DETAIL_STRINGS.creditCardLabel}
              </BText>
              <BView row align="center" gap={SpacingValue.XS} style={{ marginTop: Spacing.xs }}>
                <BView
                  fullRounded
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: CREDIT_CARD_PROVIDER_COLORS[expense.creditCard.provider],
                  }}
                />
                <BText variant={TextVariant.LABEL}>
                  {expense.creditCard.nickname} ••{expense.creditCard.last4}
                </BText>
              </BView>
            </BView>
          </BView>
        </BCard>
      )}

      <DetailsCard
        isEditing={true}
        hideCategoryRow={isBillPayment}
        categoryLabel={TRANSACTION_DETAIL_STRINGS.categoryLabel}
        categoryViewLabel=""
        categoryOptions={categoryOptions}
        categoryValue={editCategoryId ?? ''}
        onCategoryChange={(v) => setEditCategoryId(v === '' ? null : v)}
        categoryModalTitle={TRANSACTION_DETAIL_STRINGS.categoryModalTitle}
        categoryIcon={expense.category?.icon ?? undefined}
        categoryIconColor={expense.category?.color ?? themeColors.textMuted}
        viewDate={expense.date}
        editDate={editDate}
        onDateChange={splitwiseFieldsDisabled ? () => {} : setEditDate}
        dateLabel={TRANSACTION_DETAIL_STRINGS.dateLabel}
        datePlaceholder={TRANSACTION_COMMON_STRINGS.datePlaceholderISO}
        dateError={!editDate ? TRANSACTION_VALIDATION_STRINGS.dateRequired : undefined}
        viewDescription={expense.description}
        editDescription={editDescription}
        onDescriptionChange={splitwiseFieldsDisabled ? () => {} : setEditDescription}
        descriptionLabel={TRANSACTION_DETAIL_STRINGS.descriptionLabel}
        descriptionPlaceholder={TRANSACTION_DETAIL_STRINGS.descriptionPlaceholder}
        noDescriptionFallback={TRANSACTION_COMMON_STRINGS.noDescriptionFallback}
      />

      {/* Split with Splitwise — toggle only for unlinked expenses; SplitConfig itself is
          always visible for already-linked expenses (pre-populated, no toggle needed), but
          rendered read-only there since split details are edited on Splitwise directly. */}
      {!isBillPayment && showSplitToggle && (
        <BCard variant={CardVariant.ELEVATED} style={{ padding: Spacing.lg }}>
          <BView row align="center" justify="space-between">
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.splitToggleLabel}</BText>
            <BSwitch value={isSplitEnabled} onValueChange={onSplitToggleChange} />
          </BView>
        </BCard>
      )}

      {!isBillPayment && showSplitConfig && (
        <BView gap={SpacingValue.XS}>
          <SplitConfig
            state={splitState}
            onChange={onSplitStateChange}
            totalAmount={parseFormattedNumber(editAmount)}
            disabled={isSplitConfigReadOnly}
          />
          {isSplitConfigReadOnly && (
            <BText variant={TextVariant.CAPTION} muted>
              {TRANSACTION_DETAIL_STRINGS.splitConfigReadOnlyCaption}
            </BText>
          )}
        </BView>
      )}

      <BView gap={SpacingValue.SM}>
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={onSave}
          loading={isAnySaving}
          style={styles.fullWidthButton}
          paddingY={SpacingValue.MD}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {TRANSACTION_DETAIL_STRINGS.saveChangesButton}
          </BText>
        </BButton>
        <BButton
          variant={ButtonVariant.OUTLINE}
          onPress={onCancel}
          style={styles.fullWidthButton}
          paddingY={SpacingValue.MD}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.primary}>
            {TRANSACTION_DETAIL_STRINGS.cancelButton}
          </BText>
        </BButton>
      </BView>
    </>
  );
};

const styles = {
  fullWidthButton: {
    width: '100%' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
};

export default EditMode;
