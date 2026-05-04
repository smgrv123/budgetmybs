import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ScrollView as ScrollViewType, ViewStyle } from 'react-native';
import { Alert, Animated, StyleSheet } from 'react-native';
import { z } from 'zod';

import { CreditCardTxnTypeEnum } from '@/db/types';
import { BModal, BToast, BView } from '@/src/components/ui';
import { CREDIT_CARD_PROVIDER_OPTIONS } from '@/src/constants/credit-cards.config';
import { CooldownUnit } from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { SplitwisePushAction } from '@/src/constants/splitwise.config';
import { Spacing, SpacingValue, ToastVariant } from '@/src/constants/theme';
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
import { scheduleImpulseNotification } from '@/src/services/notificationService';
import { enqueueFailedPush } from '@/src/services/splitwise';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';
import type { SplitFormState } from '@/src/types/splitwise-outbound';
import { INITIAL_SPLIT_STATE } from '@/src/types/splitwise-outbound';
import type { TransactionFieldKeyValue } from '@/src/types/transaction';
import { TransactionFieldKey } from '@/src/types/transaction';
import { buildImpulseEntry, buildValidatedExpenseData, resolveCooldownMinutes } from '@/src/utils/addExpenseUtils';
import { formatLocalDateToISO } from '@/src/utils/date';
import { saveImpulsePurchase, updateNotificationId } from '@/src/utils/impulseAsyncStore';
import { checkNetworkConnection } from '@/src/utils/network';
import { screenWidth } from '@/src/utils/normalize';
import { buildSplitPayload } from '@/src/utils/splitwisePushPayload';
import dayjs from 'dayjs';
import { createTransactionFields } from '../transactionForm';
import ExpenseFormContent from './ExpenseFormContent';
import SplitStep from './SplitStep';

const CAROUSEL_ANIMATION_DURATION = 250;

const expenseSchema = z.object({
  amount: z.number().positive(TRANSACTION_VALIDATION_STRINGS.amountGreaterThanZero),
  category: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.categoryRequired),
  description: z.string().optional(),
  date: z.string().min(1, TRANSACTION_VALIDATION_STRINGS.dateRequired),
  creditCardId: z.string().optional(),
});

type Step = 'expense' | 'split';

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called after an expense is successfully created, with the saved amount */
  onExpenseCreated?: (amount: number) => void;
};

const AddTransactionModal: FC<AddTransactionModalProps> = ({ visible, onClose, onExpenseCreated }) => {
  const scrollViewRef = useRef<ScrollViewType>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatLocalDateToISO(new Date()));

  // ─── Carousel state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('expense');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ─── Impulse state ──────────────────────────────────────────────────────────
  const [isImpulse, setIsImpulse] = useState(false);
  // true when toggle was activated and notifications were denied — decided at toggle time, not submit time
  const [impulseDirectMode, setImpulseDirectMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CooldownPresetType | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CooldownUnitType>(CooldownUnit.MINUTES);

  // ─── Split state ────────────────────────────────────────────────────────────
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

  // ─── Carousel navigation ─────────────────────────────────────────────────────

  /** Animate to Step 2 (slide left) */
  const goToSplitStep = () => {
    setStep('split');
    Animated.timing(slideAnim, {
      toValue: -slideWidth,
      duration: CAROUSEL_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  /** Animate back to Step 1 (slide right) and reset split state */
  const goBackToExpenseStep = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: CAROUSEL_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setStep('expense');
      resetSplitState();
    });
  };

  /** Attempt to push to Splitwise after a local save. Shows toast on failure. */
  const attemptSplitwisePush = async (expenseId: string, expenseAmount: number, desc: string) => {
    if (!currentUser) return;

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
      totalAmount: expenseAmount,
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

  /**
   * Save directly to DB.
   * @param wasImpulse — whether the impulse override path triggered this save
   * @param withSplit — whether to push to Splitwise after local save
   */
  const saveToDatabase = (wasImpulse: boolean, withSplit: boolean) => {
    const data = buildValidatedExpenseData({ amount, category, description, date, creditCardId }, expenseSchema);
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
          if (withSplit && createdExpense) {
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

  /** "Add Expense" CTA — local save only, no Splitwise push */
  const handleAddExpense = async () => {
    const data = buildValidatedExpenseData({ amount, category, description, date, creditCardId }, expenseSchema);
    if (!data) return;

    if (isImpulse) {
      // Notifications denied at toggle time: log directly to DB with impulse flag
      if (impulseDirectMode) {
        saveToDatabase(true, false);
        return;
      }

      // Impulse path: validate cooldown, then save to AsyncStorage
      const cooldownMinutes = resolveCooldownMinutes(selectedPreset, customValue, customUnit);
      if (cooldownMinutes === null) {
        Alert.alert(IMPULSE_STRINGS.cooldownRequired);
        return;
      }

      const entry = buildImpulseEntry(data, cooldownMinutes);

      try {
        await saveImpulsePurchase(entry);
        console.log(IMPULSE_STRINGS.savedPendingLog, entry.id);

        try {
          const notificationId = await scheduleImpulseNotification({
            entryId: entry.id,
            description: entry.purchaseData.description,
            amount: entry.purchaseData.amount,
            triggerDate: dayjs(entry.expiresAt).toDate(),
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

    // Normal path: save directly to DB, no Splitwise push
    saveToDatabase(false, false);
  };

  /** "Add & Split" CTA — local save then Splitwise push */
  const handleAddAndSplit = () => {
    saveToDatabase(false, true);
  };

  /** Override: log the impulse purchase directly to DB (bypasses cooldown) */
  const handleOverride = () => {
    const data = buildValidatedExpenseData({ amount, category, description, date, creditCardId }, expenseSchema);
    if (!data) return;
    console.log(IMPULSE_STRINGS.savedOverrideLog);
    saveToDatabase(true, false);
  };

  const resetSplitState = () => {
    setSplitState(INITIAL_SPLIT_STATE);
    setToastVisible(false);
    setToastMessage('');
  };

  const handleClose = () => {
    // Reset carousel immediately (no animation needed on close)
    slideAnim.setValue(0);
    setStep('expense');
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

  const canSubmit = Boolean(parseFloat(amount) > 0 && category);

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

  // ─── Carousel steps ──────────────────────────────────────────────────────────
  type StepConfig = { key: Step; renderContent: () => ReactNode; overrideStyles?: ViewStyle };

  const STEPS: StepConfig[] = [
    {
      key: 'expense',
      renderContent: () => (
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
          canSubmit={canSubmit}
          isSubmitting={isCreatingExpense}
          onAddExpense={handleAddExpense}
          onSplitThis={goToSplitStep}
        />
      ),
    },
    {
      key: 'split',
      renderContent: () =>
        step === 'split' ? (
          <SplitStep
            splitState={splitState}
            onSplitChange={(updates) => setSplitState((prev) => ({ ...prev, ...updates }))}
            totalAmount={parseFloat(amount) || 0}
            isSubmitting={isCreatingExpense}
            canSubmit={canSubmit}
            onAddAndSplit={handleAddAndSplit}
            onBack={goBackToExpenseStep}
          />
        ) : null,
      overrideStyles: { paddingTop: Spacing.none },
    },
  ];

  const slideWidth = screenWidth - 2 * Spacing.base;

  return (
    <BModal
      isVisible={visible}
      onClose={handleClose}
      title={currentConfig.title}
      position="bottom"
      scrollTo={handleScrollTo}
      scrollOffset={scrollOffset}
      scrollOffsetMax={300}
      contentStyle={{ paddingTop: Spacing.none }}
    >
      {/* Carousel container — both steps rendered side by side, animated via translateX */}
      <BView style={styles.carouselContainer}>
        <Animated.View
          style={[styles.carouselTrack, { transform: [{ translateX: slideAnim }], width: slideWidth * 2 }]}
        >
          {STEPS.map(({ key, renderContent, overrideStyles }) => (
            <BView
              key={key}
              flex
              padding={SpacingValue.BASE}
              style={[styles.carouselSlide, { width: slideWidth }, overrideStyles && overrideStyles]}
            >
              {renderContent()}
            </BView>
          ))}
        </Animated.View>
      </BView>

      {/* Splitwise sync toast */}
      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={ToastVariant.WARNING}
        onDismiss={() => setToastVisible(false)}
      />
    </BModal>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    overflow: 'hidden',
  },
  carouselTrack: {
    flexDirection: 'row',
  },
  carouselSlide: {
    marginHorizontal: -Spacing.base,
  },
});

export default AddTransactionModal;
