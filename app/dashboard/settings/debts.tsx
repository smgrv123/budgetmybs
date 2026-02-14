import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { DebtTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  DEBT_FIELD_CONFIGS,
  DEBT_STEP_CONFIG,
  parseDebtFormData,
} from '@/constants/setup-form.config';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useDebts } from '@/src/hooks';
import type { DebtData } from '@/src/types';
import { calculateEMI } from '@/src/utils/budget';
import { generateUUID } from '@/src/utils/id';

export default function DebtsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { debts: dbDebts, isDebtsLoading, createDebtAsync, removeDebtAsync } = useDebts();

  const [debts, setDebts] = useState<DebtData[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Initialize local state from DB
  useEffect(() => {
    if (!isDebtsLoading && dbDebts) {
      setDebts(
        dbDebts.map((debt) => ({
          tempId: debt.id,
          name: debt.name,
          type: debt.type,
          customType: debt.customType ?? undefined,
          principal: debt.principal,
          interestRate: debt.interestRate,
          tenureMonths: debt.tenureMonths,
        }))
      );
    }
  }, [isDebtsLoading, dbDebts]);

  const addDebt = (debt: Omit<DebtData, 'tempId'>) => {
    setDebts((prev) => [...prev, { ...debt, tempId: generateUUID() }]);
  };

  const removeDebt = (tempId: string) => {
    setDebts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const handleRemoveItem = (tempId: string) => {
    const dbItem = dbDebts?.find((debt) => debt.id === tempId);
    if (dbItem) {
      setRemovedItemIds([...removedItemIds, dbItem.id]);
    }
    removeDebt(tempId);
  };

  const handleSaveChanges = async () => {
    try {
      const dbIds = new Set((dbDebts || []).map((debt) => debt.id));
      const addedItems = debts.filter((item) => !dbIds.has(item.tempId));

      await Promise.all(
        addedItems.map((item) => {
          const emiAmount = calculateEMI(item.principal, item.interestRate, item.tenureMonths);
          return createDebtAsync({
            name: item.name,
            type: item.type,
            customType: item.customType ?? null,
            principal: item.principal,
            remaining: item.principal,
            interestRate: item.interestRate,
            emiAmount,
            tenureMonths: item.tenureMonths,
            remainingMonths: item.tenureMonths,
            startDate: null,
            dayOfMonth: item.dayOfMonth ?? 1,
          });
        })
      );

      await Promise.all(removedItemIds.map((id) => removeDebtAsync(id)));

      router.back();
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const option = DebtTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const currencyIcon = <BText muted>{common.currency}</BText>;
  const formFields = createFormFieldsWithCurrency(DEBT_FIELD_CONFIGS, currencyIcon, ['principal']);

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <SettingsHeader title="Debts & Loans" />

      <BView flex padding="base">
        <BListStep
          strings={DEBT_STEP_CONFIG.strings}
          items={debts}
          itemCardConfig={{
            getTitle: (item) => item.name,
            getSubtitle: (item) => getTypeLabel(item.type),
            getAmount: (item) => item.principal,
            getSecondaryAmount: (item) => calculateEMI(item.principal, item.interestRate, item.tenureMonths),
            secondaryLabel: 'EMI',
          }}
          onRemoveItem={handleRemoveItem}
          formFields={formFields}
          initialFormData={DEBT_STEP_CONFIG.initialFormData}
          validationSchema={DEBT_STEP_CONFIG.validationSchema}
          onAddItem={addDebt}
          parseFormData={parseDebtFormData}
          onNext={handleSaveChanges}
          nextButtonLabel="Save Changes"
          extraFormContent={(formData) => {
            const emi =
              formData.principal && formData.interestRate && formData.tenureMonths
                ? calculateEMI(
                    parseFloat(formData.principal) || 0,
                    parseFloat(formData.interestRate) || 0,
                    parseInt(formData.tenureMonths, 10) || 0
                  )
                : 0;
            return emi > 0 ? (
              <BView row gap="sm" style={{ marginTop: Spacing.sm }}>
                <BText variant="label" muted>
                  EMI:
                </BText>
                <BText variant="subheading" color={themeColors.primary}>
                  {common.currency} {emi.toLocaleString('en-IN')}
                </BText>
              </BView>
            ) : null;
          }}
          customTypeModal={DEBT_STEP_CONFIG.customTypeModal}
        />
      </BView>
    </BSafeAreaView>
  );
}
