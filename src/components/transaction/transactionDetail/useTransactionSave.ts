/**
 * useTransactionSave
 *
 * Save logic for transaction detail screen. Handles four branches:
 * - Local-only expenses: save directly to SQLite
 * - Linked Splitwise expenses with Splitwise-relevant field changes: fetch-compare-push
 * - Linked Splitwise expenses with local-only changes (category): save directly
 * - Unlinked expenses with "Split with Splitwise" toggled on (Phase 14): save locally,
 *   push a brand-new expense via create_expense, then link with a splitwise_expenses row
 */

import { insertSplitwiseExpense, updateSplitwiseExpense } from '@/db';
import type { SplitwiseExpense, UpdateExpenseInput } from '@/db/schema-types';
import { SplitwiseSyncStatusEnum } from '@/db/types';
import { SplitwisePushAction } from '@/src/constants/splitwise.config';
import type { ToastVariantType } from '@/src/constants/theme';
import { ToastVariant } from '@/src/constants/theme';
import { TRANSACTION_DETAIL_STRINGS } from '@/src/constants/transactions.strings';
import { useExpenses, useSplitwiseExpensePush } from '@/src/hooks';
import type { SplitFormState } from '@/src/types/splitwise-outbound';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { checkNetworkConnection, NetworkError } from '@/src/utils/network';
import { buildSplitPayload, resolveSplitParticipantIds } from '@/src/utils/splitwisePushPayload';
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

/**
 * Params for the retroactive "Split with Splitwise" flow (Phase 14).
 * Only relevant when the expense is currently unlinked (no splitwise_expenses row).
 */
type RetroactiveSplitParams = {
  /** Whether the user toggled "Split with Splitwise" on for this unlinked expense */
  isEnabled: boolean;
  splitState: SplitFormState;
  /** Splitwise user ID of the connected account (payer) */
  currentUserId: number | null;
  /** Called once the remote expense + local splitwise_expenses link row are created */
  onLinked: (row: SplitwiseExpense) => void;
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
  retroactiveSplit: RetroactiveSplitParams;
};

export const useTransactionSave = ({ id, showToast, onSaveSuccess, refetchExpense }: UseTransactionSaveParams) => {
  const { updateExpense, updateExpenseAsync, isUpdatingExpense } = useExpenses();
  const { fetchSplitwiseExpense, updateSplitwiseExpenseRemote, enqueueFailedPush, pushExpenseToSplitwise } =
    useSplitwiseExpensePush();
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

  /**
   * Retroactive "Split with Splitwise" flow (Phase 14): the expense was created locally
   * and has no splitwise_expenses row yet. Save locally, push a brand-new expense to
   * Splitwise via create_expense, then link the two by inserting a splitwise_expenses row.
   *
   * Validates participants + payload BEFORE touching the DB so an invalid split never
   * leaves the local save half-applied.
   */
  const handleRetroactiveSplit = async (
    id: string,
    parsedAmount: number,
    editDescription: string,
    editDate: string,
    editCategoryId: string | null,
    retroactiveSplit: RetroactiveSplitParams
  ) => {
    const { splitState, currentUserId, onLinked } = retroactiveSplit;

    if (!currentUserId) {
      showToast(TRANSACTION_DETAIL_STRINGS.splitwiseUserRequired, ToastVariant.ERROR);
      return;
    }

    const participantUserIds = resolveSplitParticipantIds(splitState);
    if (participantUserIds.length === 0) {
      showToast(TRANSACTION_DETAIL_STRINGS.splitParticipantsRequired, ToastVariant.WARNING);
      return;
    }

    const payload = buildSplitPayload({
      totalAmount: parsedAmount,
      description: editDescription || '',
      currencyCode: 'INR',
      payerUserId: currentUserId,
      participantUserIds,
      splitState,
      groupId: splitState.groupId ? Number(splitState.groupId) : undefined,
    });

    if (!payload) {
      showToast(TRANSACTION_DETAIL_STRINGS.splitInvalidAmounts, ToastVariant.WARNING);
      return;
    }

    setIsSavingSplitwise(true);
    try {
      // 1. Save locally first — always succeeds independent of the Splitwise push.
      const localUpdateData: UpdateExpenseInput = {
        amount: parsedAmount,
        description: editDescription || null,
        date: editDate,
        categoryId: editCategoryId ?? null,
      };
      await updateExpenseAsync({ id, data: localUpdateData });
      onSaveSuccess();
      refetchExpense();

      // 2. Offline — enqueue for retry, matching the Add & Split failure-handling pattern.
      const isOnline = await checkNetworkConnection();
      if (!isOnline) {
        await enqueueFailedPush({ action: SplitwisePushAction.CREATE, expenseId: id, payload });
        showToast(TRANSACTION_DETAIL_STRINGS.splitwiseEditPushOffline, ToastVariant.WARNING);
        return;
      }

      // 3. Push the new expense to Splitwise, then link it locally (best-effort).
      try {
        const remoteId = await pushExpenseToSplitwise(payload);

        const userPaidShare = parseFloat(String(payload['users__0__paid_share'] ?? '0'));
        const userOwedShare = parseFloat(String(payload['users__0__owed_share'] ?? '0'));
        const receivableAmount = userPaidShare - userOwedShare > 0 ? userPaidShare - userOwedShare : null;

        const newRow = await insertSplitwiseExpense({
          expenseId: id,
          splitwiseId: String(remoteId),
          splitwiseGroupId: splitState.groupId ? Number(splitState.groupId) : null,
          paidByUserId: String(currentUserId),
          totalAmount: parsedAmount,
          userPaidShare,
          userOwedShare,
          receivableAmount,
          receivableSettled: 0,
          isSettlement: 0,
          splitwiseCategory: null,
          splitwiseUpdatedAt: null,
          syncStatus: SplitwiseSyncStatusEnum.SYNCED,
          lastSyncedAt: dayjs().toISOString(),
        });

        onLinked(newRow);
        showToast(TRANSACTION_DETAIL_STRINGS.retroactiveSplitPushSuccess, ToastVariant.SUCCESS);
      } catch {
        await enqueueFailedPush({ action: SplitwisePushAction.CREATE, expenseId: id, payload });
        showToast(TRANSACTION_DETAIL_STRINGS.splitwiseLocalSavedRemoteFailed, ToastVariant.WARNING);
      }
    } catch {
      showToast(TRANSACTION_DETAIL_STRINGS.saveChangesFailedToast, ToastVariant.ERROR);
    } finally {
      setIsSavingSplitwise(false);
    }
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
      retroactiveSplit,
    } = params;

    if (!expense || !id) return;

    const parsedAmount = parseFormattedNumber(editAmount);

    // Unlinked expense with "Split with Splitwise" toggled on — create a brand-new
    // remote expense and link it locally. Mutually exclusive with the linked-expense
    // branches below since it requires !isSwExpense.
    if (!isSwExpense && retroactiveSplit.isEnabled) {
      await handleRetroactiveSplit(id, parsedAmount, editDescription, editDate, editCategoryId, retroactiveSplit);
      return;
    }

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
        // `payload` is declared outside the try so the catch block can still enqueue
        // it for retry; it's only ever assigned inside the try, before the awaited push.
        let payload: Record<string, unknown> = {};
        try {
          const oldCost = parseFloat(remoteExpense.cost);
          const newCost = parsedAmount;
          payload = {
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
        } catch (error) {
          // Local edit already saved (step 3) — queue the remote update for retry
          // on the next drainPushQueue() run (app open / pull-to-refresh / reconnect sync).
          await enqueueFailedPush({
            action: SplitwisePushAction.UPDATE,
            expenseId: id,
            payload,
            splitwiseId: splitwiseRow.splitwiseId,
          });
          const message =
            error instanceof NetworkError
              ? TRANSACTION_DETAIL_STRINGS.splitwiseEditPushOffline
              : TRANSACTION_DETAIL_STRINGS.splitwiseLocalSavedRemoteFailed;
          showToast(message, ToastVariant.WARNING);
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
