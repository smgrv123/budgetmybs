import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import BListStep from '@/src/components/onboarding/listStep';
import { BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { IncomeTypeOptions, OnboardingStepId as SettingId } from '@/src/constants/onboarding.config';
import { INCOME_SETTINGS_STRINGS, SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
import {
  common,
  createFormFieldsWithCurrency,
  INCOME_FIELD_CONFIGS,
  INCOME_STEP_CONFIG,
  parseIncomeFormData,
} from '@/src/constants/setup-form.config';
import { getCurrentDate } from '@/db/utils';
import { useIncome } from '@/src/hooks';
import type { IncomeEntryData } from '@/src/types';
import { formatIndianNumber } from '@/src/utils/format';
import { generateUUID } from '@/src/utils/id';

export default function IncomeScreen() {
  const router = useRouter();
  const { income: dbIncome, isIncomeLoading, createIncomeAsync, updateIncomeAsync, removeIncomeAsync } = useIncome();

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntryData[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Initialize local state from DB
  useEffect(() => {
    if (!isIncomeLoading && dbIncome) {
      setIncomeEntries(
        dbIncome.map((item) => ({
          tempId: item.id,
          amount: item.amount,
          type: item.type,
          customType: item.customType ?? undefined,
          description: item.description ?? undefined,
          date: item.date ?? getCurrentDate(),
        }))
      );
    }
  }, [isIncomeLoading, dbIncome]);

  const addEntry = (entry: Omit<IncomeEntryData, 'tempId'>) => {
    setIncomeEntries((prev) => [...prev, { ...entry, tempId: generateUUID() }]);
  };

  const updateEntry = (tempId: string, data: Partial<IncomeEntryData>) => {
    setIncomeEntries((prev) => prev.map((e) => (e.tempId === tempId ? { ...e, ...data } : e)));
  };

  const removeEntry = (tempId: string) => {
    setIncomeEntries((prev) => prev.filter((e) => e.tempId !== tempId));
  };

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbIncome?.find((item) => item.id === tempId);
    if (dbItem) {
      setRemovedItemIds((prev) => [...prev, dbItem.id]);
    }
    removeEntry(tempId);
  };

  const handleSaveChanges = async () => {
    const dbIds = new Set((dbIncome || []).map((item) => item.id));

    const addedItems = incomeEntries.filter((item) => !dbIds.has(item.tempId));
    const updatedItems = incomeEntries.filter((item) => {
      if (!dbIds.has(item.tempId)) return false;
      const original = dbIncome?.find((e) => e.id === item.tempId);
      if (!original) return false;
      return (
        original.amount !== item.amount ||
        original.type !== item.type ||
        original.description !== (item.description ?? null)
      );
    });

    const operations = [
      ...addedItems.map((item) =>
        createIncomeAsync(
          {
            amount: item.amount,
            type: item.type,
            customType: item.customType ?? null,
            description: item.description ?? null,
            date: item.date,
          },
          {
            onError: (error) => console.error(INCOME_SETTINGS_STRINGS.createFailedLog, error),
          }
        )
      ),
      ...updatedItems.map((item) =>
        updateIncomeAsync(
          {
            id: item.tempId,
            data: {
              amount: item.amount,
              type: item.type,
              customType: item.customType ?? null,
              description: item.description ?? null,
              date: item.date,
            },
          },
          {
            onError: (error) => console.error(INCOME_SETTINGS_STRINGS.updateFailedLog, error),
          }
        )
      ),
      ...removedItemIds.map((id) =>
        removeIncomeAsync(id, {
          onError: (error) => console.error(INCOME_SETTINGS_STRINGS.removeFailedLog, error),
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
    const option = IncomeTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(INCOME_FIELD_CONFIGS, currencyIcon);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={INCOME_SETTINGS_STRINGS.screenTitle} />

      <BView flex padding="base">
        <BListStep
          stepId={SettingId.FIXED_EXPENSES}
          strings={INCOME_STEP_CONFIG.strings}
          items={incomeEntries}
          itemCardConfig={{
            getTitle: (item) => (item.type === 'other' && item.customType ? item.customType : getTypeLabel(item.type)),
            getSubtitle: (item) => item.description ?? '',
            getAmount: (item) => item.amount,
            toFormData: (item) => ({
              amount: formatIndianNumber(item.amount),
              type: item.type,
              description: item.description ?? '',
            }),
          }}
          onRemoveItem={handleRemoveItem}
          onEditItem={(tempId, data) => updateEntry(tempId, data)}
          formFields={formFields}
          initialFormData={INCOME_STEP_CONFIG.initialFormData}
          validationSchema={INCOME_STEP_CONFIG.validationSchema}
          onAddItem={(data) => addEntry({ ...data, date: getCurrentDate() })}
          parseFormData={parseIncomeFormData}
          onNext={handleSaveChanges}
          nextButtonLabel={SETTINGS_COMMON_STRINGS.saveChangesButton}
          customTypeModal={INCOME_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
