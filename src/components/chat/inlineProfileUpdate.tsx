import { ChatIntentEnum } from '@/db/types';
import { BButton, BInput, BText, BView } from '@/src/components/ui';
import {
  CHAT_FORM_TITLES,
  CHAT_PROFILE_FIELD_LABELS,
  CHAT_STRINGS,
  DebtFieldKey,
  FIELD_KEY_LABELS,
  FixedExpenseFieldKey,
  ProfileUpdateFieldKey,
  SavingsGoalFieldKey,
} from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ChatDebtData, ChatFixedExpenseData, ChatProfileUpdateData, ChatSavingsGoalData } from '@/src/types/chat';
import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type UpdatableIntent =
  | { intent: typeof ChatIntentEnum.UPDATE_PROFILE; data: ChatProfileUpdateData }
  | {
      intent: typeof ChatIntentEnum.ADD_FIXED_EXPENSE | typeof ChatIntentEnum.UPDATE_FIXED_EXPENSE;
      data: ChatFixedExpenseData;
    }
  | { intent: typeof ChatIntentEnum.ADD_DEBT | typeof ChatIntentEnum.UPDATE_DEBT; data: ChatDebtData }
  | {
      intent: typeof ChatIntentEnum.ADD_SAVINGS_GOAL | typeof ChatIntentEnum.UPDATE_SAVINGS_GOAL;
      data: ChatSavingsGoalData;
    };

// ── Field builder ─────────────────────────────────────────────────────────────

function getFields(payload: UpdatableIntent): { label: string; key: string; value: string }[] {
  switch (payload.intent) {
    case ChatIntentEnum.UPDATE_PROFILE: {
      const label = CHAT_PROFILE_FIELD_LABELS[payload.data.field] ?? payload.data.field;
      return [{ label, key: ProfileUpdateFieldKey.VALUE, value: String(payload.data.value) }];
    }
    case ChatIntentEnum.ADD_FIXED_EXPENSE:
    case ChatIntentEnum.UPDATE_FIXED_EXPENSE:
      return [
        {
          label: FIELD_KEY_LABELS[FixedExpenseFieldKey.NAME] ?? 'Name',
          key: FixedExpenseFieldKey.NAME,
          value: payload.data.name ?? '',
        },
        {
          label: FIELD_KEY_LABELS[FixedExpenseFieldKey.AMOUNT] ?? 'Amount (₹)',
          key: FixedExpenseFieldKey.AMOUNT,
          value: String(payload.data.amount ?? ''),
        },
      ];
    case ChatIntentEnum.ADD_DEBT:
    case ChatIntentEnum.UPDATE_DEBT:
      return [
        {
          label: FIELD_KEY_LABELS[FixedExpenseFieldKey.NAME] ?? 'Name',
          key: DebtFieldKey.NAME,
          value: payload.data.name ?? '',
        },
        {
          label: FIELD_KEY_LABELS[DebtFieldKey.PRINCIPAL],
          key: DebtFieldKey.PRINCIPAL,
          value: String(payload.data.principal ?? ''),
        },
        {
          label: FIELD_KEY_LABELS[DebtFieldKey.INTEREST_RATE],
          key: DebtFieldKey.INTEREST_RATE,
          value: String(payload.data.interestRate ?? ''),
        },
        {
          label: FIELD_KEY_LABELS[DebtFieldKey.EMI_AMOUNT],
          key: DebtFieldKey.EMI_AMOUNT,
          value: String(payload.data.emiAmount ?? ''),
        },
        {
          label: FIELD_KEY_LABELS[DebtFieldKey.TENURE_MONTHS],
          key: DebtFieldKey.TENURE_MONTHS,
          value: String(payload.data.tenureMonths ?? ''),
        },
      ];
    case ChatIntentEnum.ADD_SAVINGS_GOAL:
    case ChatIntentEnum.UPDATE_SAVINGS_GOAL:
      return [
        {
          label: FIELD_KEY_LABELS[FixedExpenseFieldKey.NAME] ?? 'Name',
          key: SavingsGoalFieldKey.NAME,
          value: payload.data.name ?? '',
        },
        {
          label: FIELD_KEY_LABELS[SavingsGoalFieldKey.TARGET_AMOUNT],
          key: SavingsGoalFieldKey.TARGET_AMOUNT,
          value: String(payload.data.targetAmount ?? ''),
        },
      ];
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface InlineProfileUpdateProps {
  payload: UpdatableIntent;
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function InlineProfileUpdate({ payload, onSubmit, onCancel, isSubmitting }: InlineProfileUpdateProps) {
  const themeColors = useThemeColors();
  const initialFields = getFields(payload);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initialFields.map((f) => [f.key, f.value]))
  );

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_FORM_TITLES[payload.intent]}</BText>

      {initialFields.map((field) => (
        <BInput
          key={field.key}
          label={field.label}
          value={values[field.key] ?? ''}
          onChangeText={(val) => handleChange(field.key, val)}
          keyboardType={
            field.key === FixedExpenseFieldKey.NAME ||
            field.key === SavingsGoalFieldKey.NAME ||
            field.key === DebtFieldKey.NAME
              ? 'default'
              : 'numeric'
          }
          placeholder={field.label}
        />
      ))}

      <BView row gap={SpacingValue.SM}>
        <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.text}>
            {CHAT_STRINGS.FORM_CANCEL}
          </BText>
        </BButton>
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={() => onSubmit(values)}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isSubmitting ? CHAT_STRINGS.FORM_SAVING : CHAT_STRINGS.FORM_CONFIRM}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
}
