import { SavingsTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  parseSavingsFormData,
  SAVINGS_FIELD_CONFIGS,
  SAVINGS_STEP_CONFIG,
} from '@/constants/setup-form.config';
import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useSavingsGoals } from '@/src/hooks';
import type { SavingsGoalData } from '@/src/types';
import { generateUUID } from '@/src/utils/id';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function SavingsScreen() {
  const router = useRouter();
  const {
    savingsGoals: dbGoals,
    isSavingsGoalsLoading,
    createSavingsGoalAsync,
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
      const addedItems = goals.filter((item) => !dbIds.has(item.tempId));

      await Promise.all(
        addedItems.map((item) =>
          createSavingsGoalAsync({
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            targetAmount: item.targetAmount,
          })
        )
      );

      await Promise.all(removedItemIds.map((id) => removeSavingsGoalAsync(id)));

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
          }}
          onRemoveItem={handleRemoveItem}
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
