import type { FC } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { BButton, BDropdown, BIcon, BInput, BModal, BText, BView } from '@/src/components/ui';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/src/constants/transactionModal';
import { useCategories, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { TransactionFieldKey, TransactionFieldType, type TransactionFieldKeyValue } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { createTransactionFields } from './transactionForm';

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

  const { allCategories } = useCategories();

  const { createExpense, createOneOffSaving, isCreatingExpense, isCreatingOneOffSaving } = useExpenses();

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
          onSuccess: () => {
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
    // Reset form
    setAmount('');
    setCategory('');
    setSavingsType('');
    setDescription('');
    setDate(formatLocalDateToISO(new Date()));
    onClose();
  };

  const isLoading = isCreatingExpense || isCreatingOneOffSaving;
  const canSubmit = parseFloat(amount) > 0 && (activeTab === TransactionTab.EXPENSE ? category : savingsType);

  const currentConfig = TRANSACTION_TAB_CONFIGS[activeTab];
  const transactionFields = createTransactionFields({
    configs: currentConfig.fields,
    values: { amount, category, savingsType, description, date },
    handleChange,
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

            {item.type === TransactionFieldType.CATEGORY_GRID && (
              <BView row gap={SpacingValue.SM} style={styles.categoryGrid}>
                {allCategories.map((cat) => (
                  <BButton
                    key={cat.id}
                    variant={category === cat.id ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE}
                    onPress={() => item.onValueChange(cat.id)}
                    gap={SpacingValue.XS}
                    style={styles.categoryItem}
                  >
                    {cat.icon && (
                      <BIcon
                        name={cat.icon as any}
                        size="md"
                        color={category === cat.id ? themeColors.white : cat.color || themeColors.primary}
                      />
                    )}
                    <BText
                      variant={TextVariant.CAPTION}
                      numberOfLines={1}
                      color={category === cat.id ? themeColors.white : themeColors.text}
                    >
                      {cat.name}
                    </BText>
                  </BButton>
                ))}
              </BView>
            )}

            {item.type === TransactionFieldType.DROPDOWN && item.options && (
              <BDropdown
                options={item.options}
                value={item.value}
                onValueChange={item.onValueChange}
                placeholder={item.placeholder}
              />
            )}
          </BView>
        ))}
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
    maxHeight: 400,
  },
  categoryGrid: {
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '47%',
  },
  submitContainer: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.base, // Negative margin to extend to modal edges
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
  },
});

export default AddTransactionModal;
