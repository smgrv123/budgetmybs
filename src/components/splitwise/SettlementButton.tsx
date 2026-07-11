/**
 * SettlementButton (Phase 8)
 *
 * Reusable button + IRL-warning modal for manual Splitwise settlements.
 *
 *  - mode: 'settle-up'      → user owes friend, button reads "Settle up"
 *  - mode: 'mark-received'  → friend owes user, button reads "Mark as received"
 *
 * Tapping the button opens a modal that warns the user the action is ledger-only
 * and that they should have actually transferred the cash. Confirming triggers
 * useSplitwiseSettlement, surfaces a toast, and calls onSettled.
 */

import type { FC } from 'react';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { BButton, BModal, BText, BToast, BView } from '@/src/components/ui';
import { SPLITWISE_BALANCES_STRINGS } from '@/src/constants/splitwise-balances.strings';
import { ButtonVariant, ModalPosition, Spacing, SpacingValue, TextVariant, ToastVariant } from '@/src/constants/theme';
import type { ButtonVariantType, ToastVariantType } from '@/src/constants/theme';
import { useSplitwise } from '@/src/hooks';
import { useSplitwiseSettlement } from '@/src/hooks/useSplitwiseSettlement';
import type { SettlementMode } from '@/src/hooks/useSplitwiseSettlement';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

export type SettlementButtonProps = {
  mode: SettlementMode;
  friendName: string;
  amount: number;
  friendUserId: number;
  /** Optional local splitwise_expenses row UUID (for per-expense settlement) */
  splitwiseExpenseId?: string;
  onSettled?: () => void;
  /** Optional explicit button variant override; defaults are mode-aware */
  buttonVariant?: ButtonVariantType;
};

const SettlementButton: FC<SettlementButtonProps> = ({
  mode,
  friendName,
  amount,
  friendUserId,
  splitwiseExpenseId,
  onSettled,
  buttonVariant,
}) => {
  const themeColors = useThemeColors();
  const { isConnected } = useSplitwise();
  const { settleSplitwiseAsync, isSettling } = useSplitwiseSettlement();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariantType>(ToastVariant.SUCCESS);

  const isSettleUp = mode === 'settle-up';
  const buttonLabel = isSettleUp
    ? SPLITWISE_BALANCES_STRINGS.settleUpButton
    : SPLITWISE_BALANCES_STRINGS.markReceivedButton;

  const formattedAmount = formatCurrency(amount);

  const dialogBody = isSettleUp
    ? SPLITWISE_BALANCES_STRINGS.irlWarningSettleBody(friendName, formattedAmount)
    : SPLITWISE_BALANCES_STRINGS.irlWarningReceiveBody(friendName, formattedAmount);

  const dialogConfirmLabel = isSettleUp
    ? SPLITWISE_BALANCES_STRINGS.irlWarningConfirmSettle
    : SPLITWISE_BALANCES_STRINGS.irlWarningConfirmReceive;

  const resolvedVariant = buttonVariant ?? (isSettleUp ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE);

  const showToast = (message: string, variant: ToastVariantType) => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  };

  const handleOpen = () => {
    if (amount <= 0) return;
    setIsWarningOpen(true);
  };

  // Settlements are Splitwise-only actions — hide entirely when disconnected
  if (!isConnected) return null;

  const handleConfirm = async () => {
    setIsWarningOpen(false);
    try {
      await settleSplitwiseAsync({
        mode,
        friendUserId,
        friendName,
        amount,
        splitwiseExpenseId,
      });
      showToast(SPLITWISE_BALANCES_STRINGS.settleSuccessToast, ToastVariant.SUCCESS);
      onSettled?.();
    } catch {
      // Error is logged in the hook; queue is already populated for retry.
      showToast(SPLITWISE_BALANCES_STRINGS.settleFailureToast, ToastVariant.WARNING);
    }
  };

  return (
    <>
      <BButton variant={resolvedVariant} onPress={handleOpen} loading={isSettling} disabled={amount <= 0}>
        <BText
          variant={TextVariant.LABEL}
          color={resolvedVariant === ButtonVariant.PRIMARY ? themeColors.white : themeColors.primary}
        >
          {buttonLabel}
        </BText>
      </BButton>

      <BModal
        isVisible={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title={SPLITWISE_BALANCES_STRINGS.irlWarningTitle}
        position={ModalPosition.CENTER}
      >
        <BView gap={SpacingValue.MD} style={styles.body}>
          <BText variant={TextVariant.BODY}>{dialogBody}</BText>

          <BView row gap={SpacingValue.SM} style={styles.actions}>
            <BButton variant={ButtonVariant.GHOST} onPress={() => setIsWarningOpen(false)} style={styles.actionBtn}>
              <BText variant={TextVariant.LABEL} color={themeColors.textSecondary}>
                {SPLITWISE_BALANCES_STRINGS.irlWarningCancel}
              </BText>
            </BButton>
            <BButton
              variant={ButtonVariant.PRIMARY}
              onPress={handleConfirm}
              loading={isSettling}
              style={styles.actionBtn}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {dialogConfirmLabel}
              </BText>
            </BButton>
          </BView>
        </BView>
      </BModal>

      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingVertical: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});

export default SettlementButton;
