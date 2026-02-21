import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { SavingsTypeOptions } from '@/src/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  parseSavingsFormData,
  SAVINGS_FIELD_CONFIGS,
  SAVINGS_STEP_CONFIG,
} from '@/src/constants/setup-form.config';
import { useSavingsGoals } from '@/src/hooks';
import type { SavingsGoalData } from '@/src/types';
import { formatIndianNumber } from '@/src/utils/format';
import { generateUUID } from '@/src/utils/id';

export default function SavingsScreen() {
  const router = useRouter();
  const {
    savingsGoals: dbGoals,
    isSavingsGoalsLoading,
    createSavingsGoalAsync,
    updateSavingsGoalAsync,
    removeSavingsGoalAsync,
  } = useSavingsGoals();

  const [goals, setGoals] = useState<SavingsGoalData[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Initialize local state from DB
  useEffect(() => {
    if (!isSavingsGoalsLoading && dbGoals) {
      setGoals(
        dbGoals.map((goal) => ({
          tempId: goal.id,
          name: goal.name,
          type: goal.type,
          customType: goal.customType ?? undefined,
          targetAmount: goal.targetAmount,
        }))
      );
    }
  }, [isSavingsGoalsLoading, dbGoals]);

  const addGoal = (goal: Omit<SavingsGoalData, 'tempId'>) => {
    setGoals((prev) => [...prev, { ...goal, tempId: generateUUID() }]);
  };

  const updateGoal = (tempId: string, data: Partial<SavingsGoalData>) => {
    setGoals((prev) => prev.map((g) => (g.tempId === tempId ? { ...g, ...data } : g)));
  };

  const removeGoal = (tempId: string) => {
    setGoals((prev) => prev.filter((g) => g.tempId !== tempId));
  };

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbGoals?.find((goal) => goal.id === tempId);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeGoal(tempId);
  };

  const handleSaveChanges = async () => {
    try {
      const dbIds = new Set((dbGoals || []).map((goal) => goal.id));

      // New items (not yet in DB)
      const addedItems = goals.filter((item) => !dbIds.has(item.tempId));
      // Modified items (exist in DB but content has changed)
      const updatedItems = goals.filter((item) => {
        if (!dbIds.has(item.tempId)) return false;
        const original = dbGoals?.find((g) => g.id === item.tempId);
        if (!original) return false;
        return (
          original.name !== item.name || original.type !== item.type || original.targetAmount !== item.targetAmount
        );
      });

      await Promise.all([
        ...addedItems.map((item) =>
          createSavingsGoalAsync({
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            targetAmount: item.targetAmount,
          })
        ),
        ...updatedItems.map((item) =>
          updateSavingsGoalAsync({
            id: item.tempId,
            data: {
              name: item.name,
              type: item.type,
              customType: item.customType ?? null,
              targetAmount: item.targetAmount,
            },
          })
        ),
        ...removedItemIds.map((id) => removeSavingsGoalAsync(id)),
      ]);

      router.back();
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const option = SavingsTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(SAVINGS_FIELD_CONFIGS, currencyIcon);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <SettingsHeader title="Savings Goals" />

      <BView flex padding="base">
        <BListStep
          strings={SAVINGS_STEP_CONFIG.strings}
          items={goals}
          itemCardConfig={{
            getTitle: (item) => item.name,
            getSubtitle: (item) => getTypeLabel(item.type),
            getAmount: (item) => item.targetAmount,
            toFormData: (item) => ({
              name: item.name,
              type: item.type,
              targetAmount: formatIndianNumber(item.targetAmount),
            }),
          }}
          onRemoveItem={handleRemoveItem}
          onEditItem={(tempId, data) => updateGoal(tempId, data)}
          formFields={formFields}
          initialFormData={SAVINGS_STEP_CONFIG.initialFormData}
          validationSchema={SAVINGS_STEP_CONFIG.validationSchema}
          onAddItem={addGoal}
          parseFormData={parseSavingsFormData}
          onNext={handleSaveChanges}
          nextButtonLabel="Save Changes"
          customTypeModal={SAVINGS_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
