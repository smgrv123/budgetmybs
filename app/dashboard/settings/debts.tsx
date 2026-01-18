import { DebtTypeOptions } from '@/constants/onboarding.config';
import {
  common,
  createFormFieldsWithCurrency,
  DEBT_FIELD_CONFIGS,
  DEBT_STEP_CONFIG,
  parseDebtFormData,
} from '@/constants/setup-form.config';
import { Colors, Spacing } from '@/constants/theme';
import BListStep from '@/src/components/onboarding/listStep';
import { SettingsHeader } from '@/src/components/settings';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useDebts } from '@/src/hooks';
import { useOnboardingStore } from '@/src/store';
import { calculateEMI } from '@/src/utils/budget';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function DebtsScreen() {
  const router = useRouter();
  const { debts: dbDebts, isDebtsLoading, createDebtAsync, removeDebtAsync } = useDebts();
  const { debts: storeDebts, addDebt, removeDebt } = useOnboardingStore();

  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);

  // Pre-populate store from DB once data is loaded

  useEffect(() => {
    if (!isDebtsLoading && dbDebts && dbDebts.length > 0 && storeDebts.length === 0) {
      dbDebts.forEach((debt) => {
        addDebt({
          name: debt.name,
          type: debt.type,
          customType: debt.customType ?? undefined,
          principal: debt.principal,
          interestRate: debt.interestRate,
          tenureMonths: debt.tenureMonths,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebtsLoading, dbDebts, storeDebts.length]);

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
      const addedItems = storeDebts.filter((item) => !dbIds.has(item.tempId));

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
          items={storeDebts}
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
                <BText variant="subheading" color={Colors.light.primary}>
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
