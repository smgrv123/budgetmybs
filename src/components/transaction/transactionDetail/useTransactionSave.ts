/**
 * useTransactionSave
 *
 * Save logic for transaction detail screen. Handles three branches:
 * - Local-only expenses: save directly to SQLite
 * - Linked Splitwise expenses with Splitwise-relevant field changes: fetch-compare-push
 * - Linked Splitwise expenses with local-only changes (category): save directly
 */

import { updateSplitwiseExpense } from '@/db';
import type { SplitwiseExpense, UpdateExpenseInput } from '@/db/schema-types';
import type { ToastVariantType } from '@/src/constants/theme';
import { ToastVariant } from '@/src/constants/theme';
import { TRANSACTION_DETAIL_STRINGS } from '@/src/constants/transactions.strings';
import { useExpenses } from '@/src/hooks';
import { fetchSplitwiseExpense, updateSplitwiseExpenseRemote } from '@/src/services/splitwise';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import dayjs from 'dayjs';
import { useState } from 'react';

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
  const parsedEditAmount = parseFormattedNumber(editAmount);
  if (parsedEditAmount !== originalAmount) return true;
  if (editDate !== originalDate) return true;
  if ((editDescription || null) !== (originalDescription || null)) return true;
  return false;
};

type UseTransactionSaveParams = {
  id: string | undefined;
  showToast: (msg: string, v?: ToastVariantType) => void;
  onSaveSuccess: () => void;
  refetchExpense: () => void;
};

type SaveParams = {
  editAmount: string;
  editDate: string;
  editDescription: string;
  editCategoryId: string | null;
  expense: {
    amount: number;
    date: string;
    description: string | null;
  };
  isSplitwiseExpense: boolean;
  splitwiseRow: SplitwiseExpense | null;
  setSplitwiseRow: (row: SplitwiseExpense | null) => void;
  setEditAmount: (v: string) => void;
  setEditDescription: (v: string) => void;
  setEditDate: (v: string) => void;
};

export const useTransactionSave = ({ id, showToast, onSaveSuccess, refetchExpense }: UseTransactionSaveParams) => {
  const { updateExpense, updateExpenseAsync, isUpdatingExpense } = useExpenses();
  const [isSavingSplitwise, setIsSavingSplitwise] = useState(false);

  const isAnySaving = isUpdatingExpense || isSavingSplitwise;

  const handleConflictSyncRow = async (
    splitwiseRowId: string,
    remoteUpdatedAt: string,
    setSplitwiseRow: (row: SplitwiseExpense | null) => void
  ) => {
    const updatedRow = await updateSplitwiseExpense(splitwiseRowId, {
      splitwiseUpdatedAt: remoteUpdatedAt,
      lastSyncedAt: dayjs().toISOString(),
    });
    if (updatedRow) setSplitwiseRow(updatedRow);
  };

  const handleSave = async (params: SaveParams) => {
    const {
      editAmount,
      editDate,
      editDescription,
      editCategoryId,
      expense,
      isSplitwiseExpense: isSwExpense,
      splitwiseRow,
      setSplitwiseRow,
      setEditAmount,
      setEditDescription,
      setEditDate,
    } = params;

    if (!expense || !id) return;

    const parsedAmount = parseFormattedNumber(editAmount);

    // Determine if Splitwise-relevant fields changed
    const splitwiseFieldsChanged =
      isSwExpense && splitwiseRow?.splitwiseId
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
          setEditAmount(formatIndianNumber(parseFloat(remoteExpense.cost)));
          setEditDescription(remoteExpense.description || '');
          setEditDate(dayjs(remoteExpense.date).format('YYYY-MM-DD'));

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
                if (splitwiseRow.id) {
                  void handleConflictSyncRow(splitwiseRow.id, remoteUpdatedAt, setSplitwiseRow);
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
          description: editDescription || null,
          date: editDate,
          categoryId: editCategoryId ?? null,
        };

        await updateExpenseAsync({ id, data: localUpdateData });
        onSaveSuccess();
        refetchExpense();

        // 4. Push edits to Splitwise (best-effort)
        try {
          const oldCost = parseFloat(remoteExpense.cost);
          const newCost = parsedAmount;
          const payload: Record<string, unknown> = {
            cost: newCost.toFixed(2),
            description: editDescription || '',
            date: dayjs(editDate).toISOString(),
            group_id: splitwiseRow.splitwiseGroupId
              ? Number(splitwiseRow.splitwiseGroupId)
              : (remoteExpense.group_id ?? 0),
          };

          remoteExpense.users.forEach((u, i) => {
            const oldPaid = parseFloat(u.paid_share);
            const oldOwed = parseFloat(u.owed_share);
            const ratio = oldCost > 0 ? newCost / oldCost : 1;
            payload[`users__${i}__user_id`] = u.user_id;
            payload[`users__${i}__paid_share`] = (oldPaid * ratio).toFixed(2);
            payload[`users__${i}__owed_share`] = (oldOwed * ratio).toFixed(2);
          });

          const updatedRemote = await updateSplitwiseExpenseRemote(splitwiseRow.splitwiseId, payload);

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
          showToast(TRANSACTION_DETAIL_STRINGS.splitwiseLocalSavedRemoteFailed, ToastVariant.WARNING);
        }
      } catch {
        showToast(TRANSACTION_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR);
      } finally {
        setIsSavingSplitwise(false);
      }
      return;
    }

    // Non-Splitwise expense OR only local-only fields changed — save directly
    const updateData: UpdateExpenseInput = {
      amount: parsedAmount,
      description: editDescription || null,
      date: editDate,
      categoryId: editCategoryId ?? null,
    };

    updateExpense(
      { id, data: updateData },
      {
        onSuccess: () => {
          onSaveSuccess();
          showToast(TRANSACTION_DETAIL_STRINGS.changesSavedToast, ToastVariant.SUCCESS);
        },
        onError: () => showToast(TRANSACTION_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR),
      }
    );
  };

  return { handleSave, isAnySaving };
};
