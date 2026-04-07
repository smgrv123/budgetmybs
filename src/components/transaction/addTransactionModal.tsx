import type { FC } from 'react';
import { useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { CreditCardTxnTypeEnum } from '@/db/types';
import { BButton, BDropdown, BInput, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CooldownPreset, CooldownUnit, PRESET_DEFINITIONS, toMinutes } from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TransactionTab } from '@/src/constants/transactionModal';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { useCategories, useCreditCards, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';
import { TransactionFieldKey, TransactionFieldType, type TransactionFieldKeyValue } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { generateUUID } from '@/src/utils/id';
import { saveImpulsePurchase } from '@/src/utils/impulseAsyncStore';
import dayjs from 'dayjs';
import ImpulseCooldownSection from './ImpulseCooldownSection';
import { createTransactionFields } from './transactionForm';

const expenseSchema = z.object({
  amount: z.number().positive(TRANSACTION_VALIDATION_STRINGS.amountGreaterThanZero),
  category: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.categoryRequired),
  description: z.string().optional(),
  date: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.dateRequired),
  creditCardId: z.string().optional(),
});

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called after an expense is successfully created, with the saved amount */
  onExpenseCreated?: (amount: number) => void;
};

const AddTransactionModal: FC<AddTransactionModalProps> = ({ visible, onClose, onExpenseCreated }) => {
  const themeColors = useThemeColors();
  const scrollViewRef = useRef<ScrollViewType>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  // ─── Impulse state ──────────────────────────────────────────────────────────
  const [isImpulse, setIsImpulse] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CooldownPresetType | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CooldownUnitType>(CooldownUnit.MINUTES);

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { createExpense, isCreatingExpense } = useExpenses();

  const categoryOptions = allCategories.map((cat) => ({ label: cat.name, value: cat.id }));

  const providerLabels = new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));

  const creditCardOptions = creditCards.map((card) => {
    const providerLabel = providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
    const last4Label = `${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${card.last4}`;
    const labelParts = [providerLabel, card.nickname, last4Label].filter(Boolean);

    return {
      label: labelParts.join(CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator),
      value: card.id,
    };
  });

  const handleChange = (key: TransactionFieldKeyValue, value: string) => {
    switch (key) {
      case TransactionFieldKey.AMOUNT:
        setAmount(value);
        break;
      case TransactionFieldKey.CATEGORY:
        setCategory(value);
        break;
      case TransactionFieldKey.CREDIT_CARD:
        setCreditCardId(value);
        break;
      case TransactionFieldKey.DESCRIPTION:
        setDescription(value);
        break;
      case TransactionFieldKey.DATE:
        setDate(value);
        break;
    }
  };

  const handleToggleImpulse = (value: boolean) => {
    setIsImpulse(value);
    if (value) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  /** Resolve cooldown to minutes based on selected preset and custom values */
  const resolveCooldownMinutes = (): number | null => {
    if (!selectedPreset) return null;

    if (selectedPreset !== CooldownPreset.CUSTOM) {
      const preset = PRESET_DEFINITIONS.find((p) => p.preset === selectedPreset);
      return preset?.minutes ?? null;
    }

    // Custom
    const numVal = parseInt(customValue, 10);
    if (!customValue || isNaN(numVal) || numVal <= 0) return null;
    return toMinutes(numVal, customUnit);
  };

  /** Build and validate the expense data. Returns null if validation fails. */
  const buildValidatedExpenseData = () => {
    const amountNum = parseFloat(amount);
    const normalizedCreditCardId = creditCardId.trim() || undefined;
    const validationResult = expenseSchema.safeParse({
      amount: amountNum,
      category,
      description: description || undefined,
      date,
      creditCardId: normalizedCreditCardId,
    });
    if (!validationResult.success) return null;
    return validationResult.data;
  };

  /** Save directly to DB — used both for normal submit and impulse override */
  const saveToDatabase = (wasImpulse: boolean) => {
    const data = buildValidatedExpenseData();
    if (!data) return;

    createExpense(
      {
        amount: data.amount,
        categoryId: data.category,
        description: data.description,
        date: data.date,
        creditCardId: data.creditCardId,
        creditCardTxnType: data.creditCardId ? CreditCardTxnTypeEnum.PURCHASE : null,
        wasImpulse: wasImpulse ? 1 : 0,
      },
      {
        onSuccess: () => {
          onExpenseCreated?.(data.amount);
          handleClose();
        },
        onError: (error) => {
          console.error(ADD_TRANSACTION_STRINGS.createFailedLog, error);
        },
      }
    );
  };

  const handleSubmit = () => {
    const data = buildValidatedExpenseData();
    if (!data) return;

    if (isImpulse) {
      // Impulse path: validate cooldown, then save to AsyncStorage
      const cooldownMinutes = resolveCooldownMinutes();
      if (cooldownMinutes === null) {
        Alert.alert(IMPULSE_STRINGS.cooldownRequired);
        return;
      }

      const now = dayjs();
      const entry = {
        id: generateUUID(),
        purchaseData: {
          amount: data.amount,
          categoryId: data.category,
          description: data.description,
          creditCardId: data.creditCardId,
          date: data.date,
        },
        cooldownMinutes,
        expiresAt: now.add(cooldownMinutes, 'minute').toISOString(),
        notificationId: null,
        createdAt: now.toISOString(),
      };

      saveImpulsePurchase(entry)
        .then(() => {
          console.log(IMPULSE_STRINGS.savedPendingLog, entry.id);
          handleClose();
        })
        .catch((error: unknown) => {
          console.error(IMPULSE_STRINGS.savePendingFailedLog, error);
        });

      return;
    }

    // Normal path: save directly to DB
    saveToDatabase(false);
  };

  /** Override: log the impulse purchase directly to DB (bypasses cooldown) */
  const handleOverride = () => {
    const data = buildValidatedExpenseData();
    if (!data) return;
    console.log(IMPULSE_STRINGS.savedOverrideLog);
    saveToDatabase(true);
  };

  const handleClose = () => {
    setAmount('');
    setCategory('');
    setCreditCardId('');
    setDescription('');
    setDate(formatLocalDateToISO(new Date()));
    setIsImpulse(false);
    setSelectedPreset(null);
    setCustomValue('');
    setCustomUnit(CooldownUnit.MINUTES);
    onClose();
  };

  const canSubmit = parseFloat(amount) > 0 && category;

  const currentConfig = TRANSACTION_TAB_CONFIGS[TransactionTab.EXPENSE];
  const transactionFields = createTransactionFields({
    configs: currentConfig.fields,
    values: { amount, category, creditCard: creditCardId, savingsType: '', description, date },
    handleChange,
    optionsByKey: {
      [TransactionFieldKey.CATEGORY]: categoryOptions,
      [TransactionFieldKey.CREDIT_CARD]: creditCardOptions,
    },
  });

  return (
    <BModal isVisible={visible} onClose={handleClose} title={currentConfig.title} position="bottom">
      {/* Data-driven form fields + impulse section */}
      <ScrollView ref={scrollViewRef} style={styles.fieldsContainer} showsVerticalScrollIndicator={false}>
        {transactionFields.map((item) => (
          <BView key={item.key} gap={SpacingValue.XS} marginY={SpacingValue.SM}>
            <BText variant={TextVariant.LABEL}>{item.label}</BText>

            {item.type === TransactionFieldType.INPUT && (
              <BInput
                placeholder={item.placeholder}
                value={item.value}
                onChangeText={item.onValueChange}
                keyboardType={item.keyboardType}
                multiline={item.multiline}
                numberOfLines={item.numberOfLines}
                leftIcon={item.leftIcon}
              />
            )}

            {item.type === TransactionFieldType.DROPDOWN && item.options && (
              <BDropdown
                options={item.options}
                value={item.value}
                onValueChange={item.onValueChange}
                placeholder={item.placeholder}
                searchable={true}
                modalTitle={item.modalTitle}
              />
            )}
          </BView>
        ))}

        {/* Impulse cooldown toggle & options */}
        <ImpulseCooldownSection
          isImpulse={isImpulse}
          onToggleImpulse={handleToggleImpulse}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          customValue={customValue}
          onCustomValueChange={setCustomValue}
          customUnit={customUnit}
          onCustomUnitChange={setCustomUnit}
          onOverridePress={handleOverride}
        />
      </ScrollView>

      {/* Submit Button */}
      <BView style={[styles.submitContainer, { borderTopColor: themeColors.border }]}>
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={handleSubmit}
          loading={isCreatingExpense}
          disabled={!canSubmit || isCreatingExpense}
          fullWidth
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {currentConfig.submitLabel}
          </BText>
        </BButton>
      </BView>
    </BModal>
  );
};

const styles = StyleSheet.create({
  fieldsContainer: {
    maxHeight: 500,
  },
  submitContainer: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
  },
});

export default AddTransactionModal;
