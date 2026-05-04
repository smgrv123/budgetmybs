/**
 * TransactionDetailRoute
 *
 * Coordinator: data fetch, view/edit state routing.
 * Delegates rendering to ViewMode and EditMode sub-components.
 *
 * Direct imports from transactionDetail/* to avoid circular barrel dependency.
 */

import type { SplitwiseExpense } from '@/db/schema-types';
import { getSplitwiseExpenseByExpenseId } from '@/db';
import { BIcon, BSafeAreaView, BText, BToast, BView, ScreenHeader } from '@/src/components/ui';
import type { ToastVariantType } from '@/src/constants/theme';
import { Spacing, SpacingValue, TextVariant, ToastVariant } from '@/src/constants/theme';
import { TRANSACTION_DETAIL_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { useCategories, useExpenseById, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { checkNetworkConnection } from '@/src/utils/network';
import { formatIndianNumber } from '@/src/utils/format';
import { CreditCardTxnTypeEnum } from '@/db/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';
import EditMode from '@/src/components/transaction/transactionDetail/EditMode';
import { useTransactionSave } from '@/src/components/transaction/transactionDetail/useTransactionSave';
import ViewMode from '@/src/components/transaction/transactionDetail/ViewMode';

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

export default function TransactionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const { removeExpense } = useExpenses();
  const { expense, isExpenseLoading, refetchExpense } = useExpenseById(id);

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

  const showToast = (msg: string, v: ToastVariantType = ToastVariant.WARNING) => {
    setToastMessage(msg);
    setToastVariant(v);
    setToastVisible(true);
  };

  const { handleSave, isAnySaving } = useTransactionSave({
    id,
    showToast,
    onSaveSuccess: () => setIsEditing(false),
    refetchExpense,
  });

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

  const onSave = async () => {
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

    await handleSave({
      editAmount,
      editDate,
      editDescription,
      editCategoryId,
      expense: {
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
      },
      isSplitwiseExpense,
      splitwiseRow,
      setSplitwiseRow,
      setEditAmount,
      setEditDescription,
      setEditDate,
    });
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

  const isBillPayment = expense.creditCardTxnType === CreditCardTxnTypeEnum.PAYMENT;

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

        {isEditing ? (
          <EditMode
            expense={expense}
            editAmount={editAmount}
            setEditAmount={setEditAmount}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
            editDate={editDate}
            setEditDate={setEditDate}
            editCategoryId={editCategoryId}
            setEditCategoryId={setEditCategoryId}
            categoryOptions={categoryOptions}
            splitwiseFieldsDisabled={splitwiseFieldsDisabled}
            isAnySaving={isAnySaving}
            onSave={onSave}
            onCancel={() => setIsEditing(false)}
            isBillPayment={isBillPayment}
          />
        ) : (
          <ViewMode expense={expense} isSplitwiseExpense={isSplitwiseExpense} />
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
});
