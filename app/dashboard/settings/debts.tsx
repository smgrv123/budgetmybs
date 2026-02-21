import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { DebtTypeOptions } from '@/src/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  DEBT_FIELD_CONFIGS,
  DEBT_STEP_CONFIG,
  parseDebtFormData,
} from '@/src/constants/setup-form.config';
import { Spacing } from '@/src/constants/theme';
import { useDebts } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { DebtData } from '@/src/types';
import { calculateEMI } from '@/src/utils/budget';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { generateUUID } from '@/src/utils/id';

export default function DebtsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { debts: dbDebts, isDebtsLoading, createDebtAsync, updateDebtAsync, removeDebtAsync } = useDebts();

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

  const updateDebt = (tempId: string, data: Partial<DebtData>) => {
    setDebts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, ...data } : d)));
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

      // New items (not yet in DB)
      const addedItems = debts.filter((item) => !dbIds.has(item.tempId));
      // Modified items (exist in DB but content has changed)
      const updatedItems = debts.filter((item) => {
        if (!dbIds.has(item.tempId)) return false;
        const original = dbDebts?.find((d) => d.id === item.tempId);
        if (!original) return false;
        return (
          original.name !== item.name ||
          original.type !== item.type ||
          original.principal !== item.principal ||
          original.interestRate !== item.interestRate ||
          original.tenureMonths !== item.tenureMonths
        );
      });

      await Promise.all([
        ...addedItems.map((item) => {
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
        }),
        ...updatedItems.map((item) => {
          const emiAmount = calculateEMI(item.principal, item.interestRate, item.tenureMonths);
          return updateDebtAsync({
            id: item.tempId,
            data: {
              name: item.name,
              type: item.type,
              customType: item.customType ?? null,
              principal: item.principal,
              interestRate: item.interestRate,
              emiAmount,
              tenureMonths: item.tenureMonths,
              dayOfMonth: item.dayOfMonth ?? 1,
            },
          });
        }),
        ...removedItemIds.map((id) => removeDebtAsync(id)),
      ]);

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
            toFormData: (item) => ({
              name: item.name,
              type: item.type,
              principal: formatIndianNumber(item.principal),
              interestRate: String(item.interestRate),
              tenureMonths: String(item.tenureMonths),
              dayOfMonth: item.dayOfMonth ? String(item.dayOfMonth) : '',
            }),
          }}
          onRemoveItem={handleRemoveItem}
          onEditItem={(tempId, data) => updateDebt(tempId, data)}
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
                    parseFormattedNumber(formData.principal),
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
