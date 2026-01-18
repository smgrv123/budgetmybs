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
import { useOnboardingStore } from '@/src/store';
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
  const { fixedExpenses: storeExpenses, addFixedExpense, removeFixedExpense } = useOnboardingStore();

  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Pre-populate store from DB once data is loaded

  useEffect(() => {
    if (!isFixedExpensesLoading && dbExpenses && dbExpenses.length > 0 && storeExpenses.length === 0) {
      dbExpenses.forEach((exp) => {
        addFixedExpense({
          name: exp.name,
          type: exp.type,
          customType: exp.customType ?? undefined,
          amount: exp.amount,
          dayOfMonth: exp.dayOfMonth,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFixedExpensesLoading, dbExpenses, storeExpenses.length]);

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbExpenses?.find((exp) => exp.id === tempId);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeFixedExpense(tempId);
  };

  const handleSaveChanges = async () => {
    try {
      const dbIds = new Set((dbExpenses || []).map((exp) => exp.id));
      const addedItems = storeExpenses.filter((item) => !dbIds.has(item.tempId));

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
          items={storeExpenses}
          itemCardConfig={{
            getTitle: (item) => item.name,
            getSubtitle: (item) => getTypeLabel(item.type),
            getAmount: (item) => item.amount,
          }}
          onRemoveItem={handleRemoveItem}
          formFields={formFields}
          initialFormData={FIXED_EXPENSE_STEP_CONFIG.initialFormData}
          validationSchema={FIXED_EXPENSE_STEP_CONFIG.validationSchema}
          onAddItem={addFixedExpense}
          parseFormData={parseFixedExpenseFormData}
          onNext={handleSaveChanges}
          nextButtonLabel="Save Changes"
          customTypeModal={FIXED_EXPENSE_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
