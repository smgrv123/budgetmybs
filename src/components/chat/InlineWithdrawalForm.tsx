import { BButton, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ChatWithdrawalData } from '@/src/types/chat';
import { formatCurrency } from '@/src/utils/format';
import type { FC } from 'react';
import { useState } from 'react';

interface InlineWithdrawalFormProps {
  initialData: ChatWithdrawalData;
  onSubmit: (data: ChatWithdrawalData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InlineWithdrawalForm: FC<InlineWithdrawalFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const themeColors = useThemeColors();

  const [amount, setAmount] = useState(String(initialData.amount));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount);
  const exceedsBalance = amountNum > initialData.availableBalance;

  const handleSubmit = () => {
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError(CHAT_STRINGS.FORM_WITHDRAWAL_AMOUNT_ERROR);
      return;
    }
    if (exceedsBalance) {
      setError(CHAT_STRINGS.FORM_WITHDRAWAL_EXCEEDS_BALANCE_ERROR);
      return;
    }

    setError(null);
    onSubmit({
      ...initialData,
      amount: amountNum,
    });
  };

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{CHAT_STRINGS.FORM_WITHDRAWAL_TITLE}</BText>

      {/* Read-only source label */}
      <BView gap={SpacingValue.XS}>
        <BText variant={TextVariant.CAPTION} muted>
          {CHAT_STRINGS.FORM_WITHDRAWAL_SOURCE_LABEL}
        </BText>
        <BText variant={TextVariant.BODY}>{initialData.sourceLabel}</BText>
      </BView>

      {/* Read-only available balance */}
      <BView row justify="space-between" align="center">
        <BText variant={TextVariant.CAPTION} muted>
          {CHAT_STRINGS.FORM_WITHDRAWAL_BALANCE_LABEL}
        </BText>
        <BText variant={TextVariant.BODY} color={themeColors.primary}>
          {formatCurrency(initialData.availableBalance)}
        </BText>
      </BView>

      <BInput
        label={CHAT_STRINGS.FORM_WITHDRAWAL_AMOUNT_LABEL}
        value={amount}
        onChangeText={(v) => {
          setAmount(v);
          setError(null);
        }}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <BInput
        label={CHAT_STRINGS.FORM_WITHDRAWAL_REASON_LABEL}
        value={reason}
        onChangeText={setReason}
        placeholder={CHAT_STRINGS.FORM_WITHDRAWAL_REASON_PLACEHOLDER}
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
        <BButton
          variant={ButtonVariant.DANGER}
          onPress={handleSubmit}
          disabled={isSubmitting || exceedsBalance || !amount || isNaN(amountNum) || amountNum <= 0}
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isSubmitting ? CHAT_STRINGS.FORM_SUBMITTING : CHAT_STRINGS.FORM_WITHDRAWAL_SUBMIT}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

export default InlineWithdrawalForm;
