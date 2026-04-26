import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import { Alert, StyleSheet } from 'react-native';
import { z } from 'zod';

import { CreditCardTxnTypeEnum } from '@/db/types';
import { BButton, BModal, BText, BToast, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CooldownPreset, CooldownUnit, PRESET_DEFINITIONS, toMinutes } from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { SplitwisePushAction } from '@/src/constants/splitwise.config';
import { ButtonVariant, Spacing, TextVariant, ToastVariant } from '@/src/constants/theme';
import { TRANSACTION_TAB_CONFIGS } from '@/src/constants/transactionForm.config';
import { TransactionTab } from '@/src/constants/transactionModal';
import { ADD_TRANSACTION_STRINGS, TRANSACTION_VALIDATION_STRINGS } from '@/src/constants/transactions.strings';
import {
  useCategories,
  useCreditCards,
  useExpenses,
  useImpulsePermission,
  usePushExpense,
  useSplitwise,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { scheduleImpulseNotification } from '@/src/services/notificationService';
import { enqueueFailedPush } from '@/src/services/splitwise';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';
import type { SplitFormState } from '@/src/types/splitwise-outbound';
import { INITIAL_SPLIT_STATE } from '@/src/types/splitwise-outbound';
import type { TransactionFieldKeyValue } from '@/src/types/transaction';
import { TransactionFieldKey } from '@/src/types/transaction';
import { formatLocalDateToISO } from '@/src/utils/date';
import { generateUUID } from '@/src/utils/id';
import { saveImpulsePurchase, updateNotificationId } from '@/src/utils/impulseAsyncStore';
import { checkNetworkConnection } from '@/src/utils/network';
import { buildSplitPayload } from '@/src/utils/splitwisePushPayload';
import dayjs from 'dayjs';
import { createTransactionFields } from '../transactionForm';
import ExpenseFormContent from './ExpenseFormContent';

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
  const scrollViewRef = useRef<ScrollViewType>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  // ─── Impulse state ──────────────────────────────────────────────────────────
  const [isImpulse, setIsImpulse] = useState(false);
  // true when toggle was activated and notifications were denied — decided at toggle time, not submit time
  const [impulseDirectMode, setImpulseDirectMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CooldownPresetType | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CooldownUnitType>(CooldownUnit.MINUTES);

  // ─── Split state ────────────────────────────────────────────────────────────
  const [isSplit, setIsSplit] = useState(false);
  const [splitState, setSplitState] = useState<SplitFormState>(INITIAL_SPLIT_STATE);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { allCategories } = useCategories();
  const { creditCards } = useCreditCards();
  const { createExpense, isCreatingExpense } = useExpenses();
  const { notificationsGranted, onImpulseToggleActivated } = useImpulsePermission();
  const { isConnected, currentUser } = useSplitwise();
  const { pushExpenseAsync } = usePushExpense();

  // When the user returns from Settings with notifications now granted, clear direct mode
  useEffect(() => {
    if (isImpulse && notificationsGranted) {
      setImpulseDirectMode(false);
    }
  }, [notificationsGranted, isImpulse]);

  const categoryOptions = allCategories.map((cat) => ({ label: cat.name, value: cat.id }));

  const providerLabels = new Map(CREDIT_CARD_PROVIDER_OPTIONS.map((option) => [option.value, option.label]));

  const creditCardOptions = creditCards.map((card) => {
    const providerLabel = providerLabels.get(card.provider) ?? CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
    const last4Label = `${CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} ${card.last4}`;
    const labelParts = [providerLabel, card.nickname, last4Label].filter(Boolean);

    return {
      label: labelParts.join(CREDIT_CARDS_SETTINGS_STRINGS.listItem.separator),
      value: card.id,
    };
  });

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

  const handleToggleImpulse = async (value: boolean) => {
    setIsImpulse(value);
    if (value) {
      // Permission check happens here — mode is decided at toggle time, not submit time
      const granted = await onImpulseToggleActivated();
      setImpulseDirectMode(!granted);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      setImpulseDirectMode(false);
    }
  };

  const handleToggleSplit = (val: boolean) => {
    setIsSplit(val);
    if (val) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      resetSplitState();
    }
  };

  /** Resolve cooldown to minutes based on selected preset and custom values */
  const resolveCooldownMinutes = (): number | null => {
    if (!selectedPreset) return null;

    if (selectedPreset !== CooldownPreset.CUSTOM) {
      const preset = PRESET_DEFINITIONS.find((p) => p.preset === selectedPreset);
      return preset?.minutes ?? null;
    }

    // Custom
    const numVal = parseInt(customValue, 10);
    if (!customValue || isNaN(numVal) || numVal <= 0) return null;
    return toMinutes(numVal, customUnit);
  };

  /** Build and validate the expense data. Returns null if validation fails. */
  const buildValidatedExpenseData = () => {
    const amountNum = parseFloat(amount);
    const normalizedCreditCardId = creditCardId.trim() || undefined;
    const validationResult = expenseSchema.safeParse({
      amount: amountNum,
      category,
      description: description || undefined,
      date,
      creditCardId: normalizedCreditCardId,
    });
    if (!validationResult.success) return null;
    return validationResult.data;
  };

  /** Attempt to push to Splitwise after a local save. Shows toast on failure. */
  const attemptSplitwisePush = async (expenseId: string, amount: number, desc: string) => {
    if (!isSplit || !currentUser) return;

    // Participants = group members (selectedMemberIds) + direct friends (friendIds)
    const groupMemberIds: number[] = splitState.selectedMemberIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    const directFriendIds: number[] = (splitState.friendIds ?? [])
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    // Deduplicate union; payer is added by buildSplitPayload
    const participantUserIds: number[] = [...new Set([...groupMemberIds, ...directFriendIds])];

    if (participantUserIds.length === 0) return;

    const payload = buildSplitPayload({
      totalAmount: amount,
      description: desc ?? '',
      currencyCode: 'INR',
      payerUserId: currentUser.id,
      participantUserIds,
      splitState,
      groupId: splitState.groupId ? parseInt(splitState.groupId, 10) : undefined,
    });

    if (!payload) return;

    const isOnline = await checkNetworkConnection();
    if (!isOnline) {
      await enqueueFailedPush(expenseId, SplitwisePushAction.CREATE, payload);
      setToastMessage(SPLITWISE_OUTBOUND_STRINGS.toastOffline);
      setToastVisible(true);
      return;
    }

    try {
      await pushExpenseAsync({ expenseId, payload: payload });
    } catch {
      setToastMessage(SPLITWISE_OUTBOUND_STRINGS.toastApiFailed);
      setToastVisible(true);
    }
  };

  /** Save directly to DB — used both for normal submit and impulse override */
  const saveToDatabase = (wasImpulse: boolean) => {
    const data = buildValidatedExpenseData();
    if (!data) return;

    createExpense(
      {
        amount: data.amount,
        categoryId: data.category,
        description: data.description,
        date: data.date,
        creditCardId: data.creditCardId,
        creditCardTxnType: data.creditCardId ? CreditCardTxnTypeEnum.PURCHASE : null,
        wasImpulse: wasImpulse ? 1 : 0,
      },
      {
        onSuccess: (createdExpense) => {
          onExpenseCreated?.(data.amount);
          if (createdExpense) {
            void attemptSplitwisePush(createdExpense.id, data.amount, data.description ?? '');
          }
          handleClose();
        },
        onError: (error) => {
          console.error(ADD_TRANSACTION_STRINGS.createFailedLog, error);
        },
      }
    );
  };

  const handleSubmit = async () => {
    const data = buildValidatedExpenseData();
    if (!data) return;

    if (isImpulse) {
      // Notifications denied at toggle time: log directly to DB with impulse flag
      if (impulseDirectMode) {
        saveToDatabase(true);
        return;
      }

      // Impulse path: validate cooldown, then save to AsyncStorage
      const cooldownMinutes = resolveCooldownMinutes();
      if (cooldownMinutes === null) {
        Alert.alert(IMPULSE_STRINGS.cooldownRequired);
        return;
      }

      const now = dayjs();
      const entry = {
        id: generateUUID(),
        purchaseData: (({ category, ...rest }) => ({ ...rest, categoryId: category }))(data),
        cooldownMinutes,
        expiresAt: now.add(cooldownMinutes, 'minute').toISOString(),
        notificationId: null,
        createdAt: now.toISOString(),
      };

      try {
        await saveImpulsePurchase(entry);
        console.log(IMPULSE_STRINGS.savedPendingLog, entry.id);

        try {
          const notificationId = await scheduleImpulseNotification({
            entryId: entry.id,
            description: entry.purchaseData.description,
            amount: entry.purchaseData.amount,
            triggerDate: now.add(cooldownMinutes, 'minute').toDate(),
          });
          await updateNotificationId(entry.id, notificationId);
        } catch (error: unknown) {
          console.error(IMPULSE_STRINGS.scheduleNotificationFailedLog, error);
        }

        handleClose();
      } catch (error: unknown) {
        console.error(IMPULSE_STRINGS.savePendingFailedLog, error);
      }

      return;
    }

    // Normal path: save directly to DB
    saveToDatabase(false);
  };

  /** Override: log the impulse purchase directly to DB (bypasses cooldown) */
  const handleOverride = () => {
    const data = buildValidatedExpenseData();
    if (!data) return;
    console.log(IMPULSE_STRINGS.savedOverrideLog);
    saveToDatabase(true);
  };

  const resetSplitState = () => {
    setIsSplit(false);
    setSplitState(INITIAL_SPLIT_STATE);
    setToastVisible(false);
    setToastMessage('');
  };

  const handleClose = () => {
    setAmount('');
    setCategory('');
    setCreditCardId('');
    setDescription('');
    setDate(formatLocalDateToISO(new Date()));
    setIsImpulse(false);
    setImpulseDirectMode(false);
    setSelectedPreset(null);
    setCustomValue('');
    setCustomUnit(CooldownUnit.MINUTES);
    resetSplitState();
    onClose();
  };

  const handleScrollTo = (p: { x: number; y: number; animated: boolean }) => {
    scrollViewRef.current?.scrollTo(p);
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
    <BModal
      isVisible={visible}
      onClose={handleClose}
      title={currentConfig.title}
      position="bottom"
      scrollTo={handleScrollTo}
      scrollOffset={scrollOffset}
      scrollOffsetMax={300}
    >
      {/* Data-driven form fields + impulse section */}
      <ExpenseFormContent
        scrollViewRef={scrollViewRef}
        onScroll={setScrollOffset}
        fields={transactionFields}
        isImpulse={isImpulse}
        onToggleImpulse={handleToggleImpulse}
        selectedPreset={selectedPreset}
        onPresetChange={setSelectedPreset}
        customValue={customValue}
        onCustomValueChange={setCustomValue}
        customUnit={customUnit}
        onCustomUnitChange={setCustomUnit}
        onOverridePress={handleOverride}
        impulseDirectMode={impulseDirectMode}
        isConnected={isConnected}
        isSplit={isSplit}
        onToggleSplit={handleToggleSplit}
        splitState={splitState}
        onSplitChange={(updates) => setSplitState((prev) => ({ ...prev, ...updates }))}
        totalAmount={parseFloat(amount) || 0}
      />

      {/* Splitwise sync toast */}
      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={ToastVariant.WARNING}
        onDismiss={() => setToastVisible(false)}
      />

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
