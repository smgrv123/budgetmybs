import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { z } from 'zod';

import { BButton, BDropdown, BInput, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TransactionTab } from '@/src/constants/transactionModal';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import { useCategories, useCreditCards, useExpenses } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { TransactionFieldKey, TransactionFieldType, type TransactionFieldKeyValue } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { CreditCardTxnTypeEnum } from '@/db/types';
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
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { createExpense, isCreatingExpense } = useExpenses();

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
  };

  const handleClose = () => {
    setAmount('');
    setCategory('');
    setCreditCardId('');
    setDescription('');
    setDate(formatLocalDateToISO(new Date()));
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
    maxHeight: 400,
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
