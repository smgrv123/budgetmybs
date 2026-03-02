import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useCategories } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { DropdownOption } from '@/src/types';
import type { ChatExpenseData } from '@/src/types/chat';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface InlineExpenseFormProps {
  initialData: ChatExpenseData;
  onSubmit: (data: ChatExpenseData & { categoryId?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InlineExpenseForm: FC<InlineExpenseFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const [amount, setAmount] = useState(String(initialData.amount));
  const [description, setDescription] = useState(initialData.description ?? '');

  // Options use category ID as value — that's what createExpenseAsync needs
  const categoryOptions = useMemo<DropdownOption[]>(
    () => allCategories.map((c) => ({ label: c.name, value: c.id })),
    [allCategories]
  );

  // Resolve the LLM-returned category name to its DB id
  const resolvedInitialId = useMemo(() => {
    if (!initialData.category) return '';
    const match = allCategories.find((c) => c.name.toLowerCase() === initialData.category!.toLowerCase());
    return match?.id ?? '';
  }, [allCategories, initialData.category]);

  const [categoryId, setCategoryId] = useState<string>(resolvedInitialId);

  // Re-resolve when categories load asynchronously (may be empty on first render)
  useEffect(() => {
    if (!categoryId && resolvedInitialId) setCategoryId(resolvedInitialId);
  }, [resolvedInitialId]); // eslint-disable-line react-hooks/exhaustive-deps

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
