/**
 * ExpenseFormContent
 *
 * Step 1 of the Add Expense carousel. Renders ExpenseFormFields + ImpulseCooldownSection
 * and two CTAs at the bottom:
 *   - "Add Expense" (primary) — saves locally, no Splitwise push
 *   - "Split this →" (outline, hidden when Splitwise disconnected) — slides to Step 2
 */

import type { FC, RefObject } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import { ScrollView } from 'react-native';

import { SPLITWISE_OUTBOUND_STRINGS } from '@/src/constants/splitwise-outbound.strings';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';
import type { TransactionField } from '@/src/types/transaction';
import { BButton, BText, BView } from '../../ui';
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

  // CTA props
  isConnected: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onAddExpense: () => void;
  onSplitThis: () => void;
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
  canSubmit,
  isSubmitting,
  onAddExpense,
  onSplitThis,
}) => {
  const themeColors = useThemeColors();

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ height: 550 }}
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
      <BView gap={SpacingValue.SM} row>
        {/* Primary: Add Expense */}
        <BButton
          variant={ButtonVariant.PRIMARY}
          onPress={onAddExpense}
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {SPLITWISE_OUTBOUND_STRINGS.addExpenseCta}
          </BText>
        </BButton>

        {/* Secondary: Split this → (only when Splitwise connected) */}
        {isConnected && (
          <BButton
            variant={ButtonVariant.OUTLINE}
            onPress={onSplitThis}
            disabled={!canSubmit || isSubmitting}
            style={{ flex: 1 }}
          >
            <BText variant={TextVariant.LABEL} color={themeColors.primary}>
              {SPLITWISE_OUTBOUND_STRINGS.splitThisCta}
            </BText>
          </BButton>
        )}
      </BView>
    </ScrollView>
  );
};

export default ExpenseFormContent;
