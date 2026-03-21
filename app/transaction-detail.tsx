import type { UpdateExpenseInput } from '@/db/schema-types';
import { CreditCardTxnTypeEnum } from '@/db/types';
import {
  BButton,
  BCard,
  BDateField,
  BDropdown,
  BIcon,
  BInput,
  BSafeAreaView,
  BText,
  BToast,
  BView,
  ScreenHeader,
} from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_COLORS } from '@/src/constants/credit-cards.config';
import type { ToastVariantType } from '@/src/constants/theme';
import { ButtonVariant, CardVariant, Spacing, SpacingValue, TextVariant, ToastVariant } from '@/src/constants/theme';
import {
  TRANSACTION_COMMON_STRINGS,
  TRANSACTION_DETAIL_STRINGS,
  TRANSACTION_VALIDATION_STRINGS,
} from '@/src/constants/transactions.strings';
import { useCategories, useExpenseById, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatDate } from '@/src/utils/date';
import { formatCurrency, formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

// ─── Edit form schema ──────────────────────────────────────────────────────────
const editExpenseSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, TRANSACTION_VALIDATION_STRINGS.amountRequired)
    .refine((v) => {
      const num = parseFloat(v.replace(/,/g, ''));
      return !isNaN(num) && num > 0;
    }, TRANSACTION_VALIDATION_STRINGS.amountPositive),
  date: z.iso.date(TRANSACTION_VALIDATION_STRINGS.dateValidISO),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
});

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const { updateExpense, isUpdatingExpense, removeExpense } = useExpenses();
  const { expense, isExpenseLoading } = useExpenseById(id);

  const [isEditing, setIsEditing] = useState(false);

  // Edit state — seeded from expense once loaded
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariantType>(ToastVariant.WARNING);

  const showToast = useCallback((msg: string, v: ToastVariantType = ToastVariant.WARNING) => {
    setToastMessage(msg);
    setToastVariant(v);
    setToastVisible(true);
  }, []);

  // Sync edit fields whenever expense loads / changes
  useEffect(() => {
    if (expense) {
      setEditAmount(formatIndianNumber(expense.amount));
      setEditDescription(expense.description ?? '');
      setEditDate(expense.date);
      setEditCategoryId(expense.categoryId ?? null);
    }
  }, [expense]);

  const categoryOptions = useMemo(() => allCategories.map((c) => ({ label: c.name, value: c.id })), [allCategories]);

  const isRecurring = Boolean(expense?.sourceType);

  const enterEditMode = () => {
    if (isRecurring) {
      showToast(TRANSACTION_DETAIL_STRINGS.recurringEditDisabled);
      return;
    }
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (expense) {
      setEditAmount(formatIndianNumber(expense.amount));
      setEditDescription(expense.description ?? '');
      setEditDate(expense.date);
      setEditCategoryId(expense.categoryId ?? null);
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!expense || !id) return;

    const result = editExpenseSchema.safeParse({
      amount: editAmount,
      date: editDate,
      description: editDescription,
      categoryId: editCategoryId,
    });

    if (!result.success) {
      showToast(result.error.issues[0].message);
      return;
    }

    const updateData: UpdateExpenseInput = {
      amount: parseFloat(result.data.amount.replace(/,/g, '')),
      description: result.data.description || null,
      date: result.data.date,
      categoryId: result.data.categoryId ?? null,
    };

    updateExpense(
      { id, data: updateData },
      {
        onSuccess: () => {
          setIsEditing(false);
          showToast(TRANSACTION_DETAIL_STRINGS.changesSavedToast, ToastVariant.SUCCESS);
        },
        onError: () => showToast(TRANSACTION_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR),
      }
    );
  };

  const handleDelete = () => {
    if (isRecurring) {
      showToast(TRANSACTION_DETAIL_STRINGS.recurringDeleteDisabled);
      return;
    }
    Alert.alert(TRANSACTION_DETAIL_STRINGS.deleteAlertTitle, TRANSACTION_DETAIL_STRINGS.deleteAlertBody, [
      { text: TRANSACTION_DETAIL_STRINGS.deleteAlertCancel, style: 'cancel' },
      {
        text: TRANSACTION_DETAIL_STRINGS.deleteAlertConfirm,
        style: 'destructive',
        onPress: () =>
          removeExpense(id!, {
            onSuccess: () => router.back(),
            onError: () => showToast(TRANSACTION_DETAIL_STRINGS.deleteFailedToast, ToastVariant.ERROR),
          }),
      },
    ]);
  };

  if (isExpenseLoading) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <BView flex center>
          <BIcon name="sync" size="lg" color={themeColors.primary} />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            {TRANSACTION_DETAIL_STRINGS.loadingLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  if (!expense) {
    return (
      <BSafeAreaView edges={['top', 'left', 'right']}>
        <ScreenHeader title={TRANSACTION_DETAIL_STRINGS.screenTitle} />
        <BView flex center>
          <BIcon name="alert-circle-outline" size="lg" color={themeColors.error} />
          <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
            {TRANSACTION_DETAIL_STRINGS.notFoundLabel}
          </BText>
        </BView>
      </BSafeAreaView>
    );
  }

  const isSaving = expense.isSaving === 1;
  const isBillPayment = expense.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT;
  const amountColor = isSaving ? themeColors.success : themeColors.error;
  const amountPrefix = isSaving ? '+' : '-';

  const headerActions = !isEditing
    ? [
        {
          icon: 'create-outline',
          onPress: enterEditMode,
          color: isRecurring ? themeColors.textMuted : themeColors.primary,
        },
        {
          icon: 'trash-outline',
          onPress: handleDelete,
          color: isRecurring ? themeColors.textMuted : themeColors.error,
        },
      ]
    : undefined;

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX={SpacingValue.LG}>
        <ScreenHeader
          title={TRANSACTION_DETAIL_STRINGS.screenTitle}
          titleVariant={TextVariant.SUBHEADING}
          actions={headerActions}
        />
      </BView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recurring badge */}
        {isRecurring && (
          <BView
            row
            align="center"
            gap={SpacingValue.XS}
            paddingX={SpacingValue.SM}
            paddingY={SpacingValue.XS}
            rounded="base"
            style={{ borderWidth: 1, backgroundColor: themeColors.primaryFaded, borderColor: themeColors.primary }}
          >
            <BIcon name="repeat-outline" size="sm" color={themeColors.primary} />
            <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
              {TRANSACTION_DETAIL_STRINGS.recurringReadOnlyBadge}
            </BText>
          </BView>
        )}

        {/* Amount Card */}
        <BCard variant={CardVariant.ELEVATED} style={styles.card}>
          <BText variant={TextVariant.CAPTION} muted>
            {TRANSACTION_DETAIL_STRINGS.amountLabel}
          </BText>
          {isEditing ? (
            <BInput
              value={editAmount}
              onChangeText={(text) => setEditAmount(formatIndianNumber(parseFormattedNumber(text)))}
              keyboardType="decimal-pad"
              placeholder={TRANSACTION_COMMON_STRINGS.amountPlaceholder}
              leftIcon={
                <BText variant={TextVariant.LABEL} muted>
                  {TRANSACTION_COMMON_STRINGS.currencySymbol}
                </BText>
              }
              containerStyle={{ marginTop: Spacing.xs }}
            />
          ) : (
            <BText variant={TextVariant.HEADING} style={{ color: amountColor }}>
              {amountPrefix}
              {formatCurrency(expense.amount)}
            </BText>
          )}
        </BCard>

        {/* Credit Card Attribution — read-only, shown only when expense is linked to a card */}
        {expense.creditCard && (
          <BCard variant={CardVariant.ELEVATED} style={styles.card}>
            <BView row align="center" gap={SpacingValue.MD}>
              <BIcon name="card-outline" size="sm" color={themeColors.textMuted} style={styles.rowIcon} />
              <BView flex>
                <BText variant={TextVariant.CAPTION} muted>
                  {TRANSACTION_DETAIL_STRINGS.creditCardLabel}
                </BText>
                <BView row align="center" gap={SpacingValue.XS} style={{ marginTop: Spacing.xs }}>
                  {/* Provider-coloured dot — same pattern as TransactionCard attribution */}
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
            {/* TODO: allow card reassignment in a future edit flow.
                Requires updating usedAmount on both old and new card,
                moving the creditCardExpenses row, and recomputing statement fields. */}
          </BCard>
        )}

        {/* Details Card */}
        <BCard variant={CardVariant.ELEVATED} style={styles.card}>
          <BView gap={SpacingValue.MD}>
            {/* Category Row + divider — hidden for bill payments (auto-set to Bills, not user-editable) */}
            {(!isEditing || !isBillPayment) && (
              <>
                <BView row align="flex-start" gap={SpacingValue.MD}>
                  <BIcon name="pricetag-outline" size="sm" color={themeColors.textMuted} style={styles.rowIcon} />
                  <BView flex>
                    <BText variant={TextVariant.CAPTION} muted>
                      {TRANSACTION_DETAIL_STRINGS.categoryLabel}
                    </BText>
                    {isEditing ? (
                      <BView style={{ marginTop: Spacing.xs }}>
                        <BDropdown
                          options={categoryOptions}
                          value={editCategoryId ?? ''}
                          onValueChange={(v) => setEditCategoryId(String(v) === '' ? null : String(v))}
                          searchable
                          modalTitle="Select Category"
                        />
                      </BView>
                    ) : (
                      <BView row align="center" gap={SpacingValue.XS} style={{ marginTop: Spacing.xs }}>
                        {expense.category?.icon && (
                          <BIcon
                            name={expense.category.icon as any}
                            size="sm"
                            color={expense.category.color ?? themeColors.textMuted}
                          />
                        )}
                        <BText variant={TextVariant.LABEL}>
                          {expense.category?.name ??
                            (isSaving ? expense.savingsType : TRANSACTION_COMMON_STRINGS.uncategorizedFallback) ??
                            TRANSACTION_COMMON_STRINGS.uncategorizedFallback}
                        </BText>
                      </BView>
                    )}
                  </BView>
                </BView>

                {/* Divider */}
                <BView style={[styles.divider, { backgroundColor: themeColors.border }]} />
              </>
            )}

            {/* Date Row */}
            <BView row align="center" gap={SpacingValue.MD}>
              <BIcon name="calendar-outline" size="sm" color={themeColors.textMuted} style={styles.rowIcon} />
              <BView flex>
                <BText variant={TextVariant.CAPTION} muted>
                  {TRANSACTION_DETAIL_STRINGS.dateLabel}
                </BText>
                {isEditing ? (
                  <BView style={{ marginTop: Spacing.xs }}>
                    <BDateField
                      value={editDate}
                      onChange={setEditDate}
                      placeholder={TRANSACTION_COMMON_STRINGS.datePlaceholderISO}
                      error={!editDate ? TRANSACTION_VALIDATION_STRINGS.dateRequired : undefined}
                    />
                  </BView>
                ) : (
                  <BText variant={TextVariant.LABEL} style={{ marginTop: Spacing.xs }}>
                    {formatDate(expense.date)}
                  </BText>
                )}
              </BView>
            </BView>

            {/* Divider */}
            <BView style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Description Row */}
            <BView row align="flex-start" gap={SpacingValue.MD}>
              <BIcon name="document-text-outline" size="sm" color={themeColors.textMuted} style={styles.rowIcon} />
              <BView flex>
                <BText variant={TextVariant.CAPTION} muted>
                  {TRANSACTION_DETAIL_STRINGS.descriptionLabel}
                </BText>
                {isEditing ? (
                  <BInput
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder={TRANSACTION_DETAIL_STRINGS.descriptionPlaceholder}
                    multiline
                    numberOfLines={2}
                    containerStyle={{ marginTop: Spacing.xs }}
                  />
                ) : (
                  <BText variant={TextVariant.BODY} style={{ marginTop: Spacing.xs }}>
                    {expense.description || TRANSACTION_COMMON_STRINGS.noDescriptionFallback}
                  </BText>
                )}
              </BView>
            </BView>

            {/* Impulse badge (view mode only) */}
            {!isEditing && expense.wasImpulse === 1 && (
              <>
                <BView style={[styles.divider, { backgroundColor: themeColors.border }]} />
                <BView
                  row
                  align="center"
                  gap={SpacingValue.XS}
                  paddingX={SpacingValue.SM}
                  paddingY={SpacingValue.XS}
                  rounded="base"
                  style={{
                    borderWidth: 1,
                    backgroundColor: themeColors.warningBackground,
                    borderColor: themeColors.warning,
                  }}
                >
                  <BIcon name="alert-circle-outline" size="sm" color={themeColors.warning} />
                  <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
                    {TRANSACTION_DETAIL_STRINGS.impulseBadge}
                  </BText>
                </BView>
              </>
            )}
          </BView>
        </BCard>

        {/* Edit mode: Save / Cancel CTAs */}
        {isEditing && (
          <BView gap={SpacingValue.SM}>
            <BButton
              variant={ButtonVariant.PRIMARY}
              onPress={handleSave}
              loading={isUpdatingExpense}
              style={styles.fullWidthButton}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {TRANSACTION_DETAIL_STRINGS.saveChangesButton}
              </BText>
            </BButton>
            <BButton
              variant={ButtonVariant.OUTLINE}
              onPress={cancelEdit}
              style={styles.fullWidthButton}
              paddingY={SpacingValue.MD}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.primary}>
                {TRANSACTION_DETAIL_STRINGS.cancelButton}
              </BText>
            </BButton>
          </BView>
        )}
      </ScrollView>

      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  rowIcon: {
    marginTop: Spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  fullWidthButton: {
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
