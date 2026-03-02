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
import type { FC } from 'react';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const NAME_KEYS = new Set<string>([FixedExpenseFieldKey.NAME, SavingsGoalFieldKey.NAME, DebtFieldKey.NAME]);

const UPDATE_INTENTS = new Set<string>([
  ChatIntentEnum.UPDATE_FIXED_EXPENSE,
  ChatIntentEnum.UPDATE_DEBT,
  ChatIntentEnum.UPDATE_SAVINGS_GOAL,
]);

function getExistingName(payload: UpdatableIntent): string | undefined {
  if (payload.intent === ChatIntentEnum.UPDATE_PROFILE) return undefined;
  return payload.data.existingName;
}

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

function validate(fields: { key: string; value: string }[], values: Record<string, string>): string | null {
  for (const field of fields) {
    const val = values[field.key] ?? '';
    if (NAME_KEYS.has(field.key)) {
      if (!val.trim()) return `${FIELD_KEY_LABELS[field.key] ?? 'Name'} is required.`;
    } else {
      const num = parseFloat(val);
      if (!val || isNaN(num) || num <= 0)
        return `${field.key === ProfileUpdateFieldKey.VALUE ? 'Value' : (FIELD_KEY_LABELS[field.key] ?? field.key)} must be greater than 0.`;
    }
  }
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

interface InlineProfileUpdateProps {
  payload: UpdatableIntent;
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InlineProfileUpdate: FC<InlineProfileUpdateProps> = ({ payload, onSubmit, onCancel, isSubmitting }) => {
  const themeColors = useThemeColors();
  const initialFields = getFields(payload);
  const existingName = getExistingName(payload);
  const isUpdate = UPDATE_INTENTS.has(payload.intent);

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initialFields.map((f) => [f.key, f.value]))
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    const validationError = validate(initialFields, values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit(values);
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_FORM_TITLES[payload.intent]}</BText>

      {isUpdate && existingName && (
        <BView gap={SpacingValue.XS}>
          <BText variant={TextVariant.CAPTION} muted>
            Updating
          </BText>
          <BText variant={TextVariant.BODY}>{existingName}</BText>
        </BView>
      )}

      {initialFields.map((field) => (
        <BInput
          key={field.key}
          label={field.label}
          value={values[field.key] ?? ''}
          onChangeText={(val) => handleChange(field.key, val)}
          keyboardType={NAME_KEYS.has(field.key) ? 'default' : 'numeric'}
          placeholder={field.label}
        />
      ))}

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
            {isSubmitting ? CHAT_STRINGS.FORM_SAVING : CHAT_STRINGS.FORM_CONFIRM}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

export default InlineProfileUpdate;
