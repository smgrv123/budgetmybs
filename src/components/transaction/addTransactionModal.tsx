import type { FC } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/src/constants/transactionModal';
import { BButton, BDropdown, BIcon, BInput, BModal, BText, BView } from '@/src/components/ui';
import { useCategories, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { createTransactionFields } from './transactionForm';

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

const savingSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  savingsType: z.string().min(1, 'Please select a savings type'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { allCategories } = useCategories();

  const { createExpenseAsync, createOneOffSavingAsync, isCreatingExpense, isCreatingOneOffSaving } = useExpenses();

  const handleChange = (key: string, value: string) => {
    switch (key) {
      case 'amount':
        setAmount(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'savingsType':
        setSavingsType(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'date':
        setDate(value);
        break;
    }
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);

    // Validate based on active tab
    try {
      if (activeTab === TransactionTab.EXPENSE) {
        const data = expenseSchema.parse({
          amount: amountNum,
          category,
          description: description || undefined,
          date,
        });

        await createExpenseAsync({
          amount: data.amount,
          categoryId: data.category,
          description: data.description,
          date: data.date,
        });
      } else {
        const data = savingSchema.parse({
          amount: amountNum,
          savingsType,
          description: description || undefined,
          date,
        });

        await createOneOffSavingAsync({
          amount: data.amount,
          savingsType: data.savingsType as any,
          description: data.description,
          date: data.date,
        });
      }

      setValidationErrors({});
      handleClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setValidationErrors(errors);
      } else {
        console.error('Failed to create transaction:', error);
      }
    }
  };

  const handleClose = () => {
    // Reset form
    setAmount('');
    setCategory('');
    setSavingsType('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
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

            {item.type === 'input' && (
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

            {item.type === 'categoryGrid' && (
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

            {item.type === 'dropdown' && item.options && (
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
