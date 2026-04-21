/**
 * ExpenseFormContent
 *
 * Main content area of the Add Expense form. Renders ExpenseFormFields + ImpulseCooldownSection
 * + Splitwise split toggle and SplitConfig.
 */

import type { FC, RefObject } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import { ScrollView } from 'react-native';

import { SplitConfig } from '@/src/components/splitwise';
import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { BSwitch, BText, BView } from '@/src/components/ui';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';
import type { SplitFormState } from '@/src/types/splitwise-outbound';
import type { TransactionField } from '@/src/types/transaction';
import ExpenseFormFields from '../ExpenseFormFields';
import ImpulseCooldownSection from '../ImpulseCooldownSection';

export type ExpenseFormContentProps = {
  scrollViewRef: RefObject<ScrollViewType | null>;
  onScroll: (y: number) => void;
  fields: TransactionField[];

  // Impulse props
  isImpulse: boolean;
  onToggleImpulse: (value: boolean) => void;
  selectedPreset: CooldownPresetType | null;
  onPresetChange: (preset: CooldownPresetType) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  customUnit: CooldownUnitType;
  onCustomUnitChange: (unit: CooldownUnitType) => void;
  onOverridePress: () => void;
  impulseDirectMode: boolean;

  // Split props
  isConnected: boolean;
  isSplit: boolean;
  onToggleSplit: (value: boolean) => void;
  splitState: SplitFormState;
  onSplitChange: (updates: Partial<SplitFormState>) => void;
  totalAmount: number;
};

const ExpenseFormContent: FC<ExpenseFormContentProps> = ({
  scrollViewRef,
  onScroll,
  fields,
  isImpulse,
  onToggleImpulse,
  selectedPreset,
  onPresetChange,
  customValue,
  onCustomValueChange,
  customUnit,
  onCustomUnitChange,
  onOverridePress,
  impulseDirectMode,
  isConnected,
  isSplit,
  onToggleSplit,
  splitState,
  onSplitChange,
  totalAmount,
}) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ maxHeight: 600 }}
      showsVerticalScrollIndicator={false}
      onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <ExpenseFormFields fields={fields} />

      {/* Impulse cooldown toggle & options */}
      <ImpulseCooldownSection
        isImpulse={isImpulse}
        onToggleImpulse={onToggleImpulse}
        selectedPreset={selectedPreset}
        onPresetChange={onPresetChange}
        customValue={customValue}
        onCustomValueChange={onCustomValueChange}
        customUnit={customUnit}
        onCustomUnitChange={onCustomUnitChange}
        onOverridePress={onOverridePress}
        notificationsDenied={impulseDirectMode}
      />

      {/* Split with Splitwise toggle (only when connected) */}
      {isConnected && (
        <BView row align="center" justify="space-between" marginY={SpacingValue.SM}>
          <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.splitToggleLabel}</BText>
          <BSwitch value={isSplit} onValueChange={onToggleSplit} />
        </BView>
      )}

      {/* Split form (only when toggle is on) */}
      {isConnected && isSplit && <SplitConfig state={splitState} onChange={onSplitChange} totalAmount={totalAmount} />}
    </ScrollView>
  );
};

export default ExpenseFormContent;
