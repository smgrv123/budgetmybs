import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import BListStep from '@/src/components/onboarding/listStep';
import { BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { FIXED_EXPENSES_SETTINGS_STRINGS, SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
import { FixedExpenseTypeOptions } from '@/src/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  FIXED_EXPENSE_FIELD_CONFIGS,
  FIXED_EXPENSE_STEP_CONFIG,
  parseFixedExpenseFormData,
} from '@/src/constants/setup-form.config';
import { useFixedExpenses } from '@/src/hooks';
import type { FixedExpenseData } from '@/src/types';
import { formatIndianNumber } from '@/src/utils/format';
import { generateUUID } from '@/src/utils/id';

export default function FixedExpensesScreen() {
  const router = useRouter();
  const {
    fixedExpenses: dbExpenses,
    isFixedExpensesLoading,
    createFixedExpenseAsync,
    updateFixedExpenseAsync,
    removeFixedExpenseAsync,
  } = useFixedExpenses();

  const [expenses, setExpenses] = useState<FixedExpenseData[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Initialize local state from DB
  useEffect(() => {
    if (!isFixedExpensesLoading && dbExpenses) {
      setExpenses(
        dbExpenses.map((exp) => ({
          tempId: exp.id,
          name: exp.name,
          type: exp.type,
          customType: exp.customType ?? undefined,
          amount: exp.amount,
          dayOfMonth: exp.dayOfMonth,
        }))
      );
    }
  }, [isFixedExpensesLoading, dbExpenses]);

  const addExpense = (expense: Omit<FixedExpenseData, 'tempId'>) => {
    setExpenses((prev) => [...prev, { ...expense, tempId: generateUUID() }]);
  };

  const updateExpense = (tempId: string, data: Partial<FixedExpenseData>) => {
    setExpenses((prev) => prev.map((e) => (e.tempId === tempId ? { ...e, ...data } : e)));
  };

  const removeExpense = (tempId: string) => {
    setExpenses((prev) => prev.filter((e) => e.tempId !== tempId));
  };

  const handleRemoveItem = (id: string) => {
    const dbItem = dbExpenses?.find((exp) => exp.id === id);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeExpense(id);
  };

  const handleSaveChanges = async () => {
    const dbIds = new Set((dbExpenses || []).map((exp) => exp.id));

    const addedItems = expenses.filter((item) => !dbIds.has(item.tempId));
    const updatedItems = expenses.filter((item) => {
      if (!dbIds.has(item.tempId)) return false;
      const original = dbExpenses?.find((e) => e.id === item.tempId);
      if (!original) return false;
      return (
        original.name !== item.name ||
        original.type !== item.type ||
        original.amount !== item.amount ||
        original.dayOfMonth !== item.dayOfMonth
      );
    });

    const operations = [
      ...addedItems.map((item) =>
        createFixedExpenseAsync(
          {
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            amount: item.amount,
            dayOfMonth: item.dayOfMonth ?? 1,
          },
          {
            onError: (error) => console.error(FIXED_EXPENSES_SETTINGS_STRINGS.createFailedLog, error),
          }
        )
      ),
      ...updatedItems.map((item) =>
        updateFixedExpenseAsync(
          {
            id: item.tempId,
            data: {
              name: item.name,
              type: item.type,
              customType: item.customType ?? null,
              amount: item.amount,
              dayOfMonth: item.dayOfMonth ?? 1,
            },
          },
          {
            onError: (error) => console.error(FIXED_EXPENSES_SETTINGS_STRINGS.updateFailedLog, error),
          }
        )
      ),
      ...removedItemIds.map((id) =>
        removeFixedExpenseAsync(id, {
          onError: (error) => console.error(FIXED_EXPENSES_SETTINGS_STRINGS.removeFailedLog, error),
        })
      ),
    ];

    const results = await Promise.allSettled(operations);
    const hasError = results.some((result) => result.status === 'rejected');

    if (hasError) {
      Alert.alert(SETTINGS_COMMON_STRINGS.errorAlertTitle, SETTINGS_COMMON_STRINGS.saveChangesFailed);
      return;
    }

    router.back();
  };

  const getTypeLabel = (type: string) => {
    const option = FixedExpenseTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(FIXED_EXPENSE_FIELD_CONFIGS, currencyIcon);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={FIXED_EXPENSES_SETTINGS_STRINGS.screenTitle} />

      <BView flex padding="base">
        <BListStep
          strings={FIXED_EXPENSE_STEP_CONFIG.strings}
          items={expenses}
          itemCardConfig={{
            getTitle: (item) => item.name,
            getSubtitle: (item) => getTypeLabel(item.type),
            getAmount: (item) => item.amount,
            toFormData: (item) => ({
              name: item.name,
              type: item.type,
              amount: formatIndianNumber(item.amount),
              dayOfMonth: item.dayOfMonth ? String(item.dayOfMonth) : '',
            }),
          }}
          onRemoveItem={handleRemoveItem}
          onEditItem={(tempId, data) => updateExpense(tempId, data)}
          formFields={formFields}
          initialFormData={FIXED_EXPENSE_STEP_CONFIG.initialFormData}
          validationSchema={FIXED_EXPENSE_STEP_CONFIG.validationSchema}
          onAddItem={addExpense}
          parseFormData={parseFixedExpenseFormData}
          onNext={handleSaveChanges}
          nextButtonLabel={SETTINGS_COMMON_STRINGS.saveChangesButton}
          customTypeModal={FIXED_EXPENSE_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
