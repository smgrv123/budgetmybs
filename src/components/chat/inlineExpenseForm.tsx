import { BButton, BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useCategories } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { DropdownOption } from '@/src/types';
import type { ChatExpenseData } from '@/src/types/chat';
import { useMemo, useState } from 'react';

interface InlineExpenseFormProps {
  initialData: ChatExpenseData;
  /** Receives the resolved categoryId, not the raw LLM category string */
  onSubmit: (data: ChatExpenseData & { categoryId?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function InlineExpenseForm({ initialData, onSubmit, onCancel, isSubmitting }: InlineExpenseFormProps) {
  const themeColors = useThemeColors();
  const { allCategories } = useCategories();
  const [amount, setAmount] = useState(String(initialData.amount));
  const [description, setDescription] = useState(initialData.description ?? '');

  // Options use category ID as value — that's what createExpenseAsync needs
  const categoryOptions = useMemo<DropdownOption[]>(
    () => allCategories.map((c) => ({ label: c.name, value: c.id })),
    [allCategories]
  );

  // Resolve the LLM-returned category name to its DB id on initial render.
  // The LLM returns the exact name (e.g. "Food & Dining"), so we match by name.
  const resolvedInitialId = useMemo(() => {
    if (!initialData.category) return '';
    const match = allCategories.find((c) => c.name.toLowerCase() === initialData.category!.toLowerCase());
    return match?.id ?? '';
  }, [allCategories, initialData.category]);

  const [categoryId, setCategoryId] = useState<string>(resolvedInitialId);

  // Re-resolve when categories load (they may have been empty on first render)
  useMemo(() => {
    if (!categoryId && resolvedInitialId) setCategoryId(resolvedInitialId);
  }, [resolvedInitialId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!parsed || isNaN(parsed)) return;
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
}
