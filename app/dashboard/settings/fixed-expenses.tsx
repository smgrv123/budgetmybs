import { FixedExpenseTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  FIXED_EXPENSE_FIELD_CONFIGS,
  FIXED_EXPENSE_STEP_CONFIG,
  parseFixedExpenseFormData,
} from '@/constants/setup-form.config';
import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useFixedExpenses } from '@/src/hooks';
import type { FixedExpenseData } from '@/src/types';
import { generateUUID } from '@/src/utils/id';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function FixedExpensesScreen() {
  const router = useRouter();
  const {
    fixedExpenses: dbExpenses,
    isFixedExpensesLoading,
    createFixedExpenseAsync,
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
      const addedItems = expenses.filter((item) => !dbIds.has(item.tempId));

      await Promise.all(
        addedItems.map((item) =>
          createFixedExpenseAsync({
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            amount: item.amount,
            dayOfMonth: item.dayOfMonth ?? null,
          })
        )
      );

      await Promise.all(removedItemIds.map((id) => removeFixedExpenseAsync(id)));

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
          }}
          onRemoveItem={handleRemoveItem}
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
