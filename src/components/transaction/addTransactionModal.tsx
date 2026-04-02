import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { BButton, BDropdown, BIcon, BInput, BModal, BSwitch, BText, BView } from '@/src/components/ui';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/src/constants/transactionModal';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { useCategories, useExpenses } from '@/src/hooks';
import { ALL_EXPENSES_QUERY_KEY } from '@/src/hooks/useAllExpenses';
import { EXPENSES_QUERY_KEY } from '@/src/hooks/useExpenses';
import { useSplitwise } from '@/src/hooks/useSplitwise';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { getSplitwiseUser } from '@/src/config/splitwise';
import { buildCreateExpensePayload, pushExpenseToSplitwise, type SplitConfig } from '@/src/services/splitwisePush';
import { useQueryClient } from '@tanstack/react-query';
import { TransactionFieldKey, TransactionFieldType, type TransactionFieldKeyValue } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { createTransactionFields } from './transactionForm';
import SplitForm from './SplitForm';

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive(TRANSACTION_VALIDATION_STRINGS.amountGreaterThanZero),
  category: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.categoryRequired),
  description: z.string().optional(),
  date: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.dateRequired),
});

const savingSchema = z.object({
  amount: z.number().positive(TRANSACTION_VALIDATION_STRINGS.amountGreaterThanZero),
  savingsType: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.savingsTypeRequired),
  description: z.string().optional(),
  date: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.dateRequired),
});

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Unified modal for adding expenses or one-off savings
 */
const AddTransactionModal: FC<AddTransactionModalProps> = ({ visible, onClose }) => {
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TransactionTab>(TransactionTab.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [savingsType, setSavingsType] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  const queryClient = useQueryClient();
  const { allCategories } = useCategories();
  const { createExpense, createOneOffSaving, isCreatingExpense, isCreatingOneOffSaving } = useExpenses();
  const { isConnected, connect } = useSplitwise();

  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitConfig, setSplitConfig] = useState<SplitConfig | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Load Splitwise user ID once when split is enabled
  useEffect(() => {
    if (splitEnabled && currentUserId === null) {
      getSplitwiseUser().then((user) => {
        if (user) setCurrentUserId(parseInt(user.id, 10));
      });
    }
  }, [splitEnabled]);

  const handleSplitToggle = (value: boolean) => {
    if (value && !isConnected) {
      connect();
      return;
    }
    setSplitEnabled(value);
    if (!value) setSplitConfig(null);
  };

  const categoryOptions = useMemo(
    () => allCategories.map((cat) => ({ label: cat.name, value: cat.id })),
    [allCategories]
  );

  const handleChange = (key: TransactionFieldKeyValue, value: string) => {
    switch (key) {
      case TransactionFieldKey.AMOUNT:
        setAmount(value);
        break;
      case TransactionFieldKey.CATEGORY:
        setCategory(value);
        break;
      case TransactionFieldKey.SAVINGS_TYPE:
        setSavingsType(value);
        break;
      case TransactionFieldKey.DESCRIPTION:
        setDescription(value);
        break;
      case TransactionFieldKey.DATE:
        setDate(value);
        break;
    }
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (activeTab === TransactionTab.EXPENSE) {
      const validationResult = expenseSchema.safeParse({
        amount: amountNum,
        category,
        description: description || undefined,
        date,
      });
      if (!validationResult.success) return;

      createExpense(
        {
          amount: validationResult.data.amount,
          categoryId: validationResult.data.category,
          description: validationResult.data.description,
          date: validationResult.data.date,
        },
        {
          onSuccess: async (newExpense) => {
            if (splitEnabled && splitConfig && newExpense?.id && currentUserId !== null) {
              const configWithMeta: SplitConfig = {
                ...splitConfig,
                description: validationResult.data.description ?? '',
                date: validationResult.data.date,
              };
              const payload = buildCreateExpensePayload(configWithMeta, currentUserId);
              const { success } = await pushExpenseToSplitwise(newExpense.id, payload);
              if (success) {
                // Re-invalidate so the Splitwise badge appears immediately
                queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
                queryClient.invalidateQueries({ queryKey: ALL_EXPENSES_QUERY_KEY });
              }
            }
            handleClose();
          },
          onError: (error) => {
            console.error(ADD_TRANSACTION_STRINGS.createFailedLog, error);
          },
        }
      );
    }

    const validationResult = savingSchema.safeParse({
      amount: amountNum,
      savingsType,
      description: description || undefined,
      date,
    });
    if (!validationResult.success) return;

    createOneOffSaving(
      {
        amount: validationResult.data.amount,
        savingsType: validationResult.data.savingsType as any,
        description: validationResult.data.description,
        date: validationResult.data.date,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (error) => {
          console.error(ADD_TRANSACTION_STRINGS.createFailedLog, error);
        },
      }
    );
  };

  const handleClose = () => {
    setAmount('');
    setCategory('');
    setSavingsType('');
    setDescription('');
    setDate(formatLocalDateToISO(new Date()));
    setSplitEnabled(false);
    setSplitConfig(null);
    onClose();
  };

  const isLoading = isCreatingExpense || isCreatingOneOffSaving;
  const splitValid = !splitEnabled || splitConfig !== null;
  const canSubmit =
    parseFloat(amount) > 0 && (activeTab === TransactionTab.EXPENSE ? category : savingsType) && splitValid;

  const currentConfig = TRANSACTION_TAB_CONFIGS[activeTab];
  const transactionFields = createTransactionFields({
    configs: currentConfig.fields,
    values: { amount, category, savingsType, description, date },
    handleChange,
    optionsByKey: {
      [TransactionFieldKey.CATEGORY]: categoryOptions,
    },
  });

  const headerButtonGroup = [
    {
      key: TransactionTab.EXPENSE,
      title: TRANSACTION_MODAL_TEXT.tabs.expense,
      onPress: () => setActiveTab(TransactionTab.EXPENSE),
    },
    {
      key: TransactionTab.SAVING,
      title: TRANSACTION_MODAL_TEXT.tabs.saving,
      onPress: () => setActiveTab(TransactionTab.SAVING),
    },
  ];

  return (
    <BModal isVisible={visible} onClose={handleClose} title={currentConfig.title}>
      {/* Tabs */}
      <BView row gap={SpacingValue.SM} marginY={SpacingValue.XS}>
        {headerButtonGroup.map(({ title, onPress, key }) => (
          <BButton
            key={key}
            variant={activeTab === key ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
            onPress={onPress}
            style={styles.tab}
            fullWidth
          >
            <BText variant={TextVariant.LABEL} color={activeTab === key ? themeColors.white : themeColors.text}>
              {title}
            </BText>
          </BButton>
        ))}
      </BView>

      {/* Data-driven form fields */}
      <ScrollView style={styles.fieldsContainer} showsVerticalScrollIndicator={false}>
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
                modalTitle={item.key === TransactionFieldKey.CATEGORY ? 'Select Category' : undefined}
              />
            )}
          </BView>
        ))}

        {/* Splitwise split toggle — Expense tab only */}
        {activeTab === TransactionTab.EXPENSE && (
          <BView
            row
            align="center"
            justify="space-between"
            marginY={SpacingValue.SM}
            style={[styles.splitToggleRow, { borderColor: themeColors.border }]}
          >
            <BView row align="center" gap={SpacingValue.XS}>
              <BIcon name="people-outline" size="sm" color={themeColors.textMuted} />
              <BText variant={TextVariant.LABEL}>Split with Splitwise</BText>
            </BView>
            <BSwitch value={splitEnabled} onValueChange={handleSplitToggle} />
          </BView>
        )}

        {/* Split form — shown when toggle is on */}
        {activeTab === TransactionTab.EXPENSE && splitEnabled && currentUserId !== null && (
          <SplitForm
            totalAmount={parseFloat(amount) || 0}
            currentUserId={currentUserId}
            onSplitConfigChange={setSplitConfig}
          />
        )}
      </ScrollView>

      {/* Submit Button */}
      <BView style={[styles.submitContainer, { borderTopColor: themeColors.border }]}>
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!canSubmit || isLoading}
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
  tab: {
    flex: 1,
  },
  fieldsContainer: {
    maxHeight: 450,
  },
  submitContainer: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.base, // Negative margin to extend to modal edges
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
  },
  splitToggleRow: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
});

export default AddTransactionModal;
