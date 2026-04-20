import type { SplitwiseExpense, UpdateExpenseInput } from '@/db/schema-types';
import { CreditCardTxnTypeEnum } from '@/db/types';
import { getSplitwiseExpenseByExpenseId, updateSplitwiseExpense } from '@/db';
import { DetailsCard, DetailsCardDivider } from '@/src/components';
import { BButton, BCard, BIcon, BInput, BSafeAreaView, BText, BToast, BView, ScreenHeader } from '@/src/components/ui';
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
import { fetchSplitwiseExpense, updateSplitwiseExpenseRemote } from '@/src/services/splitwise';
import { checkNetworkConnection } from '@/src/utils/network';
import { formatCurrency, formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

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

/**
 * Determines whether any Splitwise-relevant fields (amount, date, description) have
 * been modified compared to the original expense values.
 */
const hasSplitwiseFieldChanges = (
  editAmount: string,
  editDate: string,
  editDescription: string,
  originalAmount: number,
  originalDate: string,
  originalDescription: string | null
): boolean => {
  const parsedEditAmount = parseFloat(editAmount.replace(/,/g, ''));
  if (parsedEditAmount !== originalAmount) return true;
  if (editDate !== originalDate) return true;
  if ((editDescription || null) !== (originalDescription || null)) return true;
  return false;
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const { updateExpense, updateExpenseAsync, isUpdatingExpense, removeExpense } = useExpenses();
  const { expense, isExpenseLoading, refetchExpense } = useExpenseById(id);
  const receivableAmount = expense?.receivableAmount ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariantType>(ToastVariant.WARNING);

  // Splitwise edit state
  const [splitwiseRow, setSplitwiseRow] = useState<SplitwiseExpense | null>(null);
  const [isSplitwiseExpense, setIsSplitwiseExpense] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSavingSplitwise, setIsSavingSplitwise] = useState(false);

  const showToast = (msg: string, v: ToastVariantType = ToastVariant.WARNING) => {
    setToastMessage(msg);
    setToastVariant(v);
    setToastVisible(true);
  };

  const isRecurring = Boolean(expense?.sourceType);

  // Check if expense is from Splitwise and check network on mount/id change
  useEffect(() => {
    if (!id) return;

    const checkSplitwise = async () => {
      const row = await getSplitwiseExpenseByExpenseId(id);
      setSplitwiseRow(row);
      setIsSplitwiseExpense(row !== null);
    };

    const checkNetwork = async () => {
      const connected = await checkNetworkConnection();
      setIsOnline(connected);
    };

    checkSplitwise();
    checkNetwork();
  }, [id]);

  const enterEditMode = () => {
    if (isRecurring) {
      showToast(TRANSACTION_DETAIL_STRINGS.recurringEditDisabled);
      return;
    }
    if (!expense) return;
    setEditAmount(formatIndianNumber(expense.amount));
    setEditDescription(expense.description ?? '');
    setEditDate(expense.date);
    setEditCategoryId(expense.categoryId ?? null);
    setIsEditing(true);
  };

  /**
   * Save handler with Splitwise conflict detection.
   *
   * For non-Splitwise expenses or local-only field changes (category),
   * saves directly to SQLite.
   *
   * For Splitwise-relevant field changes (amount, date, description),
   * fetches the latest remote version, compares timestamps, and either
   * refreshes the form (conflict) or pushes edits to Splitwise.
   */
  const handleSave = async () => {
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

    const parsedAmount = parseFloat(result.data.amount.replace(/,/g, ''));

    // Determine if Splitwise-relevant fields changed
    const splitwiseFieldsChanged =
      isSplitwiseExpense && splitwiseRow?.splitwiseId
        ? hasSplitwiseFieldChanges(
            editAmount,
            editDate,
            editDescription,
            expense.amount,
            expense.date,
            expense.description
          )
        : false;

    // If Splitwise-relevant fields changed, do the fetch-compare-push flow
    if (splitwiseFieldsChanged && splitwiseRow?.splitwiseId) {
      setIsSavingSplitwise(true);
      try {
        // 1. Fetch the latest version from Splitwise
        const remoteExpense = await fetchSplitwiseExpense(splitwiseRow.splitwiseId);

        if (!remoteExpense) {
          showToast(TRANSACTION_DETAIL_STRINGS.splitwiseFetchFailed, ToastVariant.ERROR);
          setIsSavingSplitwise(false);
          return;
        }

        // 2. Compare remote updated_at with local splitwiseUpdatedAt
        const localUpdatedAt = splitwiseRow.splitwiseUpdatedAt;
        const remoteUpdatedAt = remoteExpense.updated_at;

        if (localUpdatedAt && dayjs(remoteUpdatedAt).isAfter(dayjs(localUpdatedAt))) {
          // CONFLICT: Remote was modified since last sync
          // Refresh form with latest remote data
          setEditAmount(formatIndianNumber(parseFloat(remoteExpense.cost)));
          setEditDescription(remoteExpense.description || '');
          setEditDate(dayjs(remoteExpense.date).format('YYYY-MM-DD'));

          // Also update the local DB with the latest remote data so the view is fresh
          const remoteAmount = parseFloat(remoteExpense.cost);
          const remoteDate = dayjs(remoteExpense.date).format('YYYY-MM-DD');
          updateExpense(
            {
              id,
              data: {
                amount: remoteAmount,
                description: remoteExpense.description || null,
                date: remoteDate,
              },
            },
            {
              onSuccess: () => {
                // Update the splitwise_expenses row with the new timestamp
                if (splitwiseRow.id) {
                  updateSplitwiseExpense(splitwiseRow.id, {
                    splitwiseUpdatedAt: remoteUpdatedAt,
                    lastSyncedAt: dayjs().toISOString(),
                  }).then((updatedRow) => {
                    if (updatedRow) setSplitwiseRow(updatedRow);
                  });
                }
                refetchExpense();
              },
            }
          );

          showToast(TRANSACTION_DETAIL_STRINGS.splitwiseConflictToast, ToastVariant.WARNING);
          setIsSavingSplitwise(false);
          return;
        }

        // 3. Save to local DB first
        const localUpdateData: UpdateExpenseInput = {
          amount: parsedAmount,
          description: result.data.description || null,
          date: result.data.date,
          categoryId: result.data.categoryId ?? null,
        };

        await updateExpenseAsync({ id, data: localUpdateData });
        setIsEditing(false);
        refetchExpense();

        // 4. Push edits to Splitwise (best-effort — local save already succeeded)
        try {
          // Build flat payload with recalculated user shares.
          // Splitwise requires shares to sum to the new cost.
          const oldCost = parseFloat(remoteExpense.cost);
          const newCost = parsedAmount;
          const payload: Record<string, unknown> = {
            cost: newCost.toFixed(2),
            description: result.data.description || '',
            date: dayjs(result.data.date).toISOString(),
            group_id: splitwiseRow.splitwiseGroupId
              ? Number(splitwiseRow.splitwiseGroupId)
              : (remoteExpense.group_id ?? 0),
          };

          // Recalculate each user's shares proportionally
          remoteExpense.users.forEach((u, i) => {
            const oldPaid = parseFloat(u.paid_share);
            const oldOwed = parseFloat(u.owed_share);
            const ratio = oldCost > 0 ? newCost / oldCost : 1;
            payload[`users__${i}__user_id`] = u.user_id;
            payload[`users__${i}__paid_share`] = (oldPaid * ratio).toFixed(2);
            payload[`users__${i}__owed_share`] = (oldOwed * ratio).toFixed(2);
          });

          const updatedRemote = await updateSplitwiseExpenseRemote(splitwiseRow.splitwiseId, payload);

          // Update splitwise_expenses row with confirmed remote timestamp and share values
          if (splitwiseRow.id) {
            const localUserId = Number(splitwiseRow.paidByUserId);
            const userEntry = updatedRemote.users.find((u) => u.user_id === localUserId);

            const updatedRow = await updateSplitwiseExpense(splitwiseRow.id, {
              splitwiseUpdatedAt: updatedRemote.updated_at,
              lastSyncedAt: dayjs().toISOString(),
              totalAmount: parseFloat(updatedRemote.cost),
              ...(userEntry
                ? {
                    userPaidShare: parseFloat(userEntry.paid_share),
                    userOwedShare: parseFloat(userEntry.owed_share),
                    receivableAmount:
                      parseFloat(userEntry.paid_share) - parseFloat(userEntry.owed_share) > 0
                        ? parseFloat(userEntry.paid_share) - parseFloat(userEntry.owed_share)
                        : null,
                  }
                : {}),
              splitwiseGroupId: updatedRemote.group_id ?? null,
            });
            if (updatedRow) setSplitwiseRow(updatedRow);
          }

          showToast(TRANSACTION_DETAIL_STRINGS.splitwiseEditPushSuccess, ToastVariant.SUCCESS);
        } catch {
          // Local save succeeded — only the remote Splitwise push failed
          showToast(TRANSACTION_DETAIL_STRINGS.splitwiseLocalSavedRemoteFailed, ToastVariant.WARNING);
        }
      } catch {
        // Local DB save itself failed — nothing was persisted
        showToast(TRANSACTION_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR);
      } finally {
        setIsSavingSplitwise(false);
      }
      return;
    }

    // Non-Splitwise expense OR only local-only fields changed — save directly
    const updateData: UpdateExpenseInput = {
      amount: parsedAmount,
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

  // Splitwise-relevant fields are non-editable when offline
  const splitwiseFieldsDisabled = isSplitwiseExpense && !isOnline;

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

  const categoryOptions = allCategories.map((c) => ({ label: c.name, value: c.id }));

  const categoryViewLabel =
    expense.category?.name ??
    (isSaving ? expense.savingsType : TRANSACTION_COMMON_STRINGS.uncategorizedFallback) ??
    TRANSACTION_COMMON_STRINGS.uncategorizedFallback;

  const isAnySaving = isUpdatingExpense || isSavingSplitwise;

  const bottomSection = (() => {
    const badges: React.ReactNode[] = [];

    if (!isEditing && expense.wasImpulse === 1) {
      badges.push(
        <BView
          key="impulse"
          row
          align="center"
          gap={SpacingValue.XS}
          paddingX={SpacingValue.SM}
          paddingY={SpacingValue.XS}
          rounded="base"
          style={{ borderWidth: 1, backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }}
        >
          <BIcon name="alert-circle-outline" size="sm" color={themeColors.warning} />
          <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
            {TRANSACTION_DETAIL_STRINGS.impulseBadge}
          </BText>
        </BView>
      );
    }

    if (!isEditing && isSplitwiseExpense) {
      badges.push(
        <BView
          key="splitwise"
          row
          align="center"
          gap={SpacingValue.XS}
          paddingX={SpacingValue.SM}
          paddingY={SpacingValue.XS}
          rounded="base"
          style={{ borderWidth: 1, backgroundColor: themeColors.primaryFaded, borderColor: themeColors.primary }}
        >
          <BIcon name="swap-horizontal-outline" size="sm" color={themeColors.primary} />
          <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
            {TRANSACTION_DETAIL_STRINGS.splitwiseBadge}
          </BText>
        </BView>
      );
    }

    if (badges.length === 0) return null;

    return (
      <>
        <DetailsCardDivider />
        <BView gap={SpacingValue.SM}>{badges}</BView>
      </>
    );
  })();

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

        {/* Offline warning for Splitwise expenses in edit mode */}
        {isEditing && splitwiseFieldsDisabled && (
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
              {TRANSACTION_DETAIL_STRINGS.splitwiseFieldDisabledOffline}
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
              editable={!splitwiseFieldsDisabled}
              leftIcon={
                <BText variant={TextVariant.LABEL} muted>
                  {TRANSACTION_COMMON_STRINGS.currencySymbol}
                </BText>
              }
              containerStyle={[{ marginTop: Spacing.xs }, splitwiseFieldsDisabled ? { opacity: 0.5 } : undefined]}
            />
          ) : (
            <>
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
            </>
          )}
        </BCard>

        {/* Credit Card Attribution — read-only */}
        {expense.creditCard && (
          <BCard variant={CardVariant.ELEVATED} style={styles.card}>
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
          isEditing={isEditing}
          hideCategoryRow={isEditing && isBillPayment}
          categoryLabel={TRANSACTION_DETAIL_STRINGS.categoryLabel}
          categoryViewLabel={categoryViewLabel}
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
          bottomSection={bottomSection}
        />

        {isEditing && (
          <BView gap={SpacingValue.SM}>
            <BButton
              variant={ButtonVariant.PRIMARY}
              onPress={handleSave}
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
              onPress={() => setIsEditing(false)}
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
  fullWidthButton: {
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
