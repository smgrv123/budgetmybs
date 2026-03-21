import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useCategories, useCreditCards } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { DropdownOption } from '@/src/types';
import type { ChatExpenseData } from '@/src/types/chat';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface InlineExpenseFormProps {
  initialData: ChatExpenseData;
  onSubmit: (data: ChatExpenseData & { categoryId?: string; creditCardId?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InlineExpenseForm: FC<InlineExpenseFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const [amount, setAmount] = useState(String(initialData.amount));
  const [description, setDescription] = useState(initialData.description ?? '');

  // Options use category ID as value — that's what createExpenseAsync needs
  const categoryOptions = useMemo<DropdownOption[]>(
    () => allCategories.map((c) => ({ label: c.name, value: c.id })),
    [allCategories]
  );

  // Options use card ID as value
  const creditCardOptions = useMemo<DropdownOption[]>(
    () => creditCards.map((c) => ({ label: `${c.nickname} ••${c.last4}`, value: c.id })),
    [creditCards]
  );

  // Resolve the LLM-returned category name to its DB id
  const resolvedInitialCategoryId = useMemo(() => {
    if (!initialData.category) return '';
    const match = allCategories.find((c) => c.name.toLowerCase() === initialData.category!.toLowerCase());
    return match?.id ?? '';
  }, [allCategories, initialData.category]);

  // Resolve the LLM-returned card nickname to its DB id
  const resolvedInitialCardId = useMemo(() => {
    if (!initialData.creditCard) return '';
    const match = creditCards.find((c) => c.nickname.toLowerCase() === initialData.creditCard!.toLowerCase());
    return match?.id ?? '';
  }, [creditCards, initialData.creditCard]);

  const [categoryId, setCategoryId] = useState<string>(resolvedInitialCategoryId);
  const [creditCardId, setCreditCardId] = useState<string>(resolvedInitialCardId);

  // Re-resolve when data loads asynchronously (may be empty on first render)
  useEffect(() => {
    if (!categoryId && resolvedInitialCategoryId) setCategoryId(resolvedInitialCategoryId);
  }, [resolvedInitialCategoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!creditCardId && resolvedInitialCardId) setCreditCardId(resolvedInitialCardId);
  }, [resolvedInitialCardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    setError(null);
    onSubmit({
      amount: parsed,
      category: initialData.category,
      description: description || undefined,
      categoryId: categoryId || undefined,
      creditCardId: creditCardId || undefined,
    });
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_STRINGS.FORM_EXPENSE_TITLE}</BText>

      <BInput label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />

      <BDropdown
        label="Category"
        options={categoryOptions}
        value={categoryId}
        onValueChange={(v) => setCategoryId(String(v))}
        searchable
        modalTitle="Select Category"
      />

      <BDropdown
        label={CHAT_STRINGS.FORM_CREDIT_CARD_LABEL}
        options={creditCardOptions}
        value={creditCardId}
        onValueChange={(v) => setCreditCardId(String(v))}
        searchable
        modalTitle={CHAT_STRINGS.FORM_CREDIT_CARD_MODAL_TITLE}
        placeholder="None (cash)"
      />

      <BInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. coffee at Starbucks"
      />

      {error && (
        <BText variant={TextVariant.CAPTION} color={themeColors.danger}>
          {error}
        </BText>
      )}

      <BView row gap={SpacingValue.SM}>
        <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.text}>
            {CHAT_STRINGS.FORM_CANCEL}
          </BText>
        </BButton>
        <BButton variant={ButtonVariant.PRIMARY} onPress={handleSubmit} disabled={isSubmitting} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isSubmitting ? CHAT_STRINGS.FORM_SUBMITTING : CHAT_STRINGS.FORM_EXPENSE_SUBMIT}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

export default InlineExpenseForm;
