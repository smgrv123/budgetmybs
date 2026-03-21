import type { FC } from 'react';
import { useState } from 'react';
import { Alert } from 'react-native';

import { BButton, BDateField, BInput, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useCreditCards } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatLocalDateToISO } from '@/src/utils/date';
import { formatIndianNumber } from '@/src/utils/format';
import type { AmountDue } from '@/db/schema-types';

export interface PayBillModalProps {
  isVisible: boolean;
  onClose: () => void;
  creditCardId: string;
  creditCardNickname: string;
  amountDue: AmountDue;
}

const { payBill: STRINGS } = CREDIT_CARDS_SETTINGS_STRINGS;

const PayBillModal: FC<PayBillModalProps> = ({ isVisible, onClose, creditCardId, creditCardNickname, amountDue }) => {
  const themeColors = useThemeColors();
  const { payBill, isPayingBill } = useCreditCards();

  const [amount, setAmount] = useState(amountDue.total > 0 ? String(amountDue.total) : '');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;

    const description = STRINGS.descriptionTemplate(creditCardNickname);

    payBill(
      { data: { creditCardId, amount: amountNum, date }, description },
      {
        onSuccess: () => {
          Alert.alert(STRINGS.successTitle, STRINGS.successBody(creditCardNickname, formatIndianNumber(amountNum)));
          onClose();
        },
        onError: (error) => {
          console.error(STRINGS.logs.paymentFailed, error);
        },
      }
    );
  };

  return (
    <BModal isVisible={isVisible} onClose={onClose} title={STRINGS.title}>
      <BView gap={SpacingValue.MD}>
        {amountDue.total > 0 && (
          <BText variant={TextVariant.CAPTION} muted>
            {CREDIT_CARDS_SETTINGS_STRINGS.details.amountDueLabel}: ₹{formatIndianNumber(amountDue.total)}
          </BText>
        )}

        <BInput
          label={STRINGS.amountLabel}
          placeholder={STRINGS.amountPlaceholder}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <BDateField label={STRINGS.dateLabel} value={date} onChange={setDate} />

        <BView row gap={SpacingValue.MD} marginY={SpacingValue.SM}>
          <BView flex>
            <BButton variant={ButtonVariant.OUTLINE} onPress={onClose} disabled={isPayingBill}>
              <BText variant={TextVariant.LABEL} style={{ color: themeColors.text }}>
                {STRINGS.cancelButton}
              </BText>
            </BButton>
          </BView>
          <BView flex>
            <BButton
              variant={ButtonVariant.PRIMARY}
              onPress={handleSubmit}
              disabled={isPayingBill || !amount || parseFloat(amount) <= 0}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {STRINGS.submitButton}
              </BText>
            </BButton>
          </BView>
        </BView>
      </BView>
    </BModal>
  );
};

export default PayBillModal;
