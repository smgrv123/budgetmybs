import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { BButton, BDropdown, BInput, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TRANSACTION_MODAL_TEXT, TransactionTab } from '@/src/constants/transactionModal';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { useCategories, useCreditCards, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { TransactionFieldKey, TransactionFieldType, type TransactionFieldKeyValue } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { CreditCardTxnTypeEnum } from '@/db/types';
import { createTransactionFields } from './transactionForm';

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive(TRANSACTION_VALIDATION_STRINGS.amountGreaterThanZero),
  category: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.categoryRequired),
  description: z.string().optional(),
  date: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.dateRequired),
  creditCardId: z.string().optional(),
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
  /** Called after an expense (not a saving) is successfully created, with the saved amount */
  onExpenseCreated?: (amount: number) => void;
};

/**
 * Unified modal for adding expenses or one-off savings
 */
const AddTransactionModal: FC<AddTransactionModalProps> = ({ visible, onClose, onExpenseCreated }) => {
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TransactionTab>(TransactionTab.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [savingsType, setSavingsType] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();

  const { createExpense, createOneOffSaving, isCreatingExpense, isCreatingOneOffSaving } = useExpenses();

  const categoryOptions = useMemo(
    () => allCategories.map((cat) => ({ label: cat.name, value: cat.id })),
    [allCategories]
  );

  const providerLabels = useMemo(() => {
    return new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));
  }, []);

  const creditCardOptions = useMemo(() => {
    return creditCards.map((card) => {
      const providerLabel = providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
      const last4Label = `${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${card.last4}`;
      const labelParts = [providerLabel, card.nickname, last4Label].filter(Boolean);

      return {
        label: labelParts.join(CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator),
        value: card.id,
      };
    });
  }, [creditCards, providerLabels]);

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
      const normalizedCreditCardId = creditCardId.trim() || undefined;
      const validationResult = expenseSchema.safeParse({
        amount: amountNum,
        category,
        description: description || undefined,
        date,
        creditCardId: normalizedCreditCardId,
      });
      if (!validationResult.success) return;

      createExpense(
        {
          amount: validationResult.data.amount,
          categoryId: validationResult.data.category,
          description: validationResult.data.description,
          date: validationResult.data.date,
          creditCardId: validationResult.data.creditCardId,
          creditCardTxnType: validationResult.data.creditCardId ? CreditCardTxnTypeEnum.PURCHASE : null,
        },
        {
          onSuccess: () => {
            onExpenseCreated?.(validationResult.data.amount);
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
    setCreditCardId('');
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
    values: { amount, category, creditCard: creditCardId, savingsType, description, date },
    handleChange,
    optionsByKey: {
      [TransactionFieldKey.CATEGORY]: categoryOptions,
      [TransactionFieldKey.CREDIT_CARD]: creditCardOptions,
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
    <BModal isVisible={visible} onClose={handleClose} title={currentConfig.title} position="bottom">
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
                modalTitle={item.modalTitle}
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
