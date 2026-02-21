import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
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
    try {
      const dbIds = new Set((dbExpenses || []).map((exp) => exp.id));

      // New items (not yet in DB)
      const addedItems = expenses.filter((item) => !dbIds.has(item.tempId));
      // Modified items (exist in DB but content has changed)
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

      await Promise.all([
        ...addedItems.map((item) =>
          createFixedExpenseAsync({
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            amount: item.amount,
            dayOfMonth: item.dayOfMonth ?? 1,
          })
        ),
        ...updatedItems.map((item) =>
          updateFixedExpenseAsync({
            id: item.tempId,
            data: {
              name: item.name,
              type: item.type,
              customType: item.customType ?? null,
              amount: item.amount,
              dayOfMonth: item.dayOfMonth ?? 1,
            },
          })
        ),
        ...removedItemIds.map((id) => removeFixedExpenseAsync(id)),
      ]);

      router.back();
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const option = FixedExpenseTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(FIXED_EXPENSE_FIELD_CONFIGS, currencyIcon);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <SettingsHeader title="Fixed Expenses" />

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
          nextButtonLabel="Save Changes"
          customTypeModal={FIXED_EXPENSE_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
