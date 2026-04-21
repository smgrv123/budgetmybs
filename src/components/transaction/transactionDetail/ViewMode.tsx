/**
 * ViewMode
 *
 * Read-only display for the transaction detail screen.
 * Shows amount, credit card info, details card, and badges (impulse, Splitwise).
 */

import type { FC } from 'react';

import DetailsCard, { Divider as DetailsCardDivider } from '@/src/components/DetailsCard';
import InfoBadge from '@/src/components/InfoBadge';
import { BCard, BIcon, BText, BView } from '@/src/components/ui';
import type { CreditCardProvider } from '@/db/types';
import { CREDIT_CARD_PROVIDER_COLORS } from '@/src/constants/credit-cards.config';
import { CardVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_COMMON_STRINGS, TRANSACTION_DETAIL_STRINGS } from '@/src/constants/transactions.strings';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

type ViewModeExpense = {
  amount: number;
  isSaving: number | null;
  description: string | null;
  date: string;
  categoryId: string | null;
  savingsType: string | null;
  wasImpulse: number | null;
  creditCardTxnType: string | null;
  receivableAmount: number | null;
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
};

export type ViewModeProps = {
  expense: ViewModeExpense;
  isSplitwiseExpense: boolean;
};

const ViewMode: FC<ViewModeProps> = ({ expense, isSplitwiseExpense }) => {
  const themeColors = useThemeColors();

  const isSaving = expense.isSaving === 1;
  const amountColor = isSaving ? themeColors.success : themeColors.error;
  const amountPrefix = isSaving ? '+' : '-';
  const receivableAmount = expense.receivableAmount ?? null;

  const categoryViewLabel =
    expense.category?.name ??
    (isSaving ? expense.savingsType : TRANSACTION_COMMON_STRINGS.uncategorizedFallback) ??
    TRANSACTION_COMMON_STRINGS.uncategorizedFallback;

  const badgeItems: React.ReactNode[] = [];

  if (expense.wasImpulse === 1) {
    badgeItems.push(
      <InfoBadge
        key="impulse"
        variant="warning"
        iconName="alert-circle-outline"
        title={TRANSACTION_DETAIL_STRINGS.impulseBadge}
      />
    );
  }

  if (isSplitwiseExpense) {
    badgeItems.push(
      <InfoBadge
        key="splitwise"
        variant="primary"
        iconName="swap-horizontal-outline"
        title={TRANSACTION_DETAIL_STRINGS.splitwiseBadge}
      />
    );
  }

  const bottomSection =
    badgeItems.length === 0 ? null : (
      <>
        <DetailsCardDivider />
        <BView gap={SpacingValue.SM}>{badgeItems}</BView>
      </>
    );

  return (
    <>
      {/* Amount Card */}
      <BCard variant={CardVariant.ELEVATED} style={{ padding: Spacing.lg }}>
        <BText variant={TextVariant.CAPTION} muted>
          {TRANSACTION_DETAIL_STRINGS.amountLabel}
        </BText>
        <BText variant={TextVariant.HEADING} style={{ color: amountColor }}>
          {amountPrefix}
          {formatCurrency(expense.amount)}
        </BText>
        {receivableAmount !== null && (
          <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xxs }}>
            {formatCurrency(expense.amount)} {TRANSACTION_DETAIL_STRINGS.splitwisePaidLabel} ·{' '}
            {formatCurrency(expense.amount - receivableAmount)} {TRANSACTION_DETAIL_STRINGS.splitwiseShareLabel}
          </BText>
        )}
      </BCard>

      {/* Credit Card Attribution — read-only */}
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
        isEditing={false}
        categoryLabel={TRANSACTION_DETAIL_STRINGS.categoryLabel}
        categoryViewLabel={categoryViewLabel}
        categoryOptions={[]}
        categoryValue=""
        onCategoryChange={() => {}}
        categoryIcon={expense.category?.icon ?? undefined}
        categoryIconColor={expense.category?.color ?? themeColors.textMuted}
        viewDate={expense.date}
        editDate=""
        onDateChange={() => {}}
        dateLabel={TRANSACTION_DETAIL_STRINGS.dateLabel}
        viewDescription={expense.description}
        editDescription=""
        onDescriptionChange={() => {}}
        descriptionLabel={TRANSACTION_DETAIL_STRINGS.descriptionLabel}
        noDescriptionFallback={TRANSACTION_COMMON_STRINGS.noDescriptionFallback}
        bottomSection={bottomSection}
      />
    </>
  );
};

export default ViewMode;
