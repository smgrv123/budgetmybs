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
import { useOnboardingStore } from '@/src/store';
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
  const { savingsGoals: storeGoals, addSavingsGoal, removeSavingsGoal } = useOnboardingStore();

  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Pre-populate store from DB once data is loaded

  useEffect(() => {
    if (!isSavingsGoalsLoading && dbGoals && dbGoals.length > 0 && storeGoals.length === 0) {
      dbGoals.forEach((goal) => {
        addSavingsGoal({
          name: goal.name,
          type: goal.type,
          customType: goal.customType ?? undefined,
          targetAmount: goal.targetAmount,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSavingsGoalsLoading, dbGoals, storeGoals.length]);

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbGoals?.find((goal) => goal.id === tempId);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeSavingsGoal(tempId);
  };

  const handleSaveChanges = async () => {
    try {
      const dbIds = new Set((dbGoals || []).map((goal) => goal.id));
      const addedItems = storeGoals.filter((item) => !dbIds.has(item.tempId));

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
          items={storeGoals}
          itemCardConfig={{
            getTitle: (item) => item.name,
            getSubtitle: (item) => getTypeLabel(item.type),
            getAmount: (item) => item.targetAmount,
          }}
          onRemoveItem={handleRemoveItem}
          formFields={formFields}
          initialFormData={SAVINGS_STEP_CONFIG.initialFormData}
          validationSchema={SAVINGS_STEP_CONFIG.validationSchema}
          onAddItem={addSavingsGoal}
          parseFormData={parseSavingsFormData}
          onNext={handleSaveChanges}
          nextButtonLabel="Save Changes"
          customTypeModal={SAVINGS_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
