import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import BListStep from '@/src/components/onboarding/listStep';
import { BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { SavingsTypeOptions, OnboardingStepId as SettingId } from '@/src/constants/onboarding.config';
import { SAVINGS_SETTINGS_STRINGS, SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
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
    const dbIds = new Set((dbGoals || []).map((goal) => goal.id));

    const addedItems = goals.filter((item) => !dbIds.has(item.tempId));
    const updatedItems = goals.filter((item) => {
      if (!dbIds.has(item.tempId)) return false;
      const original = dbGoals?.find((g) => g.id === item.tempId);
      if (!original) return false;
      return original.name !== item.name || original.type !== item.type || original.targetAmount !== item.targetAmount;
    });

    const operations = [
      ...addedItems.map((item) =>
        createSavingsGoalAsync(
          {
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            targetAmount: item.targetAmount,
          },
          {
            onError: (error) => console.error(SAVINGS_SETTINGS_STRINGS.createFailedLog, error),
          }
        )
      ),
      ...updatedItems.map((item) =>
        updateSavingsGoalAsync(
          {
            id: item.tempId,
            data: {
              name: item.name,
              type: item.type,
              customType: item.customType ?? null,
              targetAmount: item.targetAmount,
            },
          },
          {
            onError: (error) => console.error(SAVINGS_SETTINGS_STRINGS.updateFailedLog, error),
          }
        )
      ),
      ...removedItemIds.map((id) =>
        removeSavingsGoalAsync(id, {
          onError: (error) => console.error(SAVINGS_SETTINGS_STRINGS.removeFailedLog, error),
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
    const option = SavingsTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(SAVINGS_FIELD_CONFIGS, currencyIcon);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={SAVINGS_SETTINGS_STRINGS.screenTitle} />

      <BView flex padding="base">
        <BListStep
          stepId={SettingId.SAVINGS}
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
          nextButtonLabel={SETTINGS_COMMON_STRINGS.saveChangesButton}
          customTypeModal={SAVINGS_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
