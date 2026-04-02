import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';

import { BDropdown, BIcon, BText, BView } from '@/src/components/ui';
import { BorderRadius, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitTargets, type SplitTarget } from '@/src/hooks/useSplitTargets';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { SplitConfig, SplitType } from '@/src/services/splitwisePush';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SplitFormProps = {
  totalAmount: number;
  currentUserId: number;
  onSplitConfigChange: (config: SplitConfig | null) => void;
};

const SPLIT_TYPE_OPTIONS: { label: string; value: SplitType }[] = [
  { label: 'Equal', value: 'equal' },
  { label: 'Exact', value: 'exact' },
  { label: 'Percentage', value: 'percentage' },
  { label: 'Shares', value: 'shares' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SplitForm: FC<SplitFormProps> = ({ totalAmount, currentUserId, onSplitConfigChange }) => {
  const themeColors = useThemeColors();
  const { targets, isLoading } = useSplitTargets();

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  // For non-equal splits: how much the friend owes (user owes the rest)
  const [friendOwedInput, setFriendOwedInput] = useState('');

  const selectedTarget = targets.find((t) => t.id === selectedTargetId) ?? null;
  const isGroupTarget = selectedTarget?.type === 'group';

  // Groups only support equal split in Phase 4
  const effectiveSplitType: SplitType = isGroupTarget ? 'equal' : splitType;

  // Compute and emit split config whenever inputs change
  useEffect(() => {
    if (!selectedTarget || totalAmount <= 0) {
      onSplitConfigChange(null);
      return;
    }

    const config = buildConfig(selectedTarget, effectiveSplitType, totalAmount, currentUserId, friendOwedInput);
    onSplitConfigChange(config);
  }, [selectedTargetId, effectiveSplitType, totalAmount, friendOwedInput]);

  const targetOptions = targets.map((t) => ({
    label: t.type === 'group' ? `${t.label} (group)` : t.label,
    value: t.id,
  }));

  const splitTypeOptions = isGroupTarget ? [{ label: 'Equal', value: 'equal' as SplitType }] : SPLIT_TYPE_OPTIONS;

  const showCustomInputs = !isGroupTarget && effectiveSplitType !== 'equal' && selectedTarget !== null;

  const inputLabel = (() => {
    switch (effectiveSplitType) {
      case 'exact':
        return `${selectedTarget?.label ?? 'Friend'} owes (₹)`;
      case 'percentage':
        return `${selectedTarget?.label ?? 'Friend'} owes (%)`;
      case 'shares':
        return `${selectedTarget?.label ?? 'Friend'}'s shares`;
      default:
        return 'Amount';
    }
  })();

  const friendOwedNum = parseFloat(friendOwedInput) || 0;
  const validationError = showCustomInputs ? getValidationError(effectiveSplitType, friendOwedNum, totalAmount) : null;

  if (isLoading) {
    return (
      <BView row align="center" gap={SpacingValue.XS} marginY={SpacingValue.SM}>
        <ActivityIndicator size="small" color={themeColors.primary} />
        <BText variant={TextVariant.CAPTION} muted>
          Loading contacts...
        </BText>
      </BView>
    );
  }

  return (
    <BView gap={SpacingValue.SM} marginY={SpacingValue.SM}>
      {/* Target picker */}
      <BView gap={SpacingValue.XS}>
        <BText variant={TextVariant.LABEL}>Split with</BText>
        <BDropdown
          options={targetOptions}
          value={selectedTargetId ?? undefined}
          onValueChange={(val) => setSelectedTargetId(String(val))}
          placeholder="Select friend or group"
          searchable
          modalTitle="Split with"
        />
      </BView>

      {selectedTarget && (
        <>
          {/* Split type */}
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>Split type</BText>
            <BDropdown
              options={splitTypeOptions}
              value={effectiveSplitType}
              onValueChange={(val) => setSplitType(val as SplitType)}
              placeholder="Select split type"
              modalTitle="Split type"
            />
            {isGroupTarget && (
              <BView row align="center" gap={SpacingValue.XS}>
                <BIcon name="information-circle-outline" size="sm" color={themeColors.textMuted} />
                <BText variant={TextVariant.CAPTION} muted>
                  Groups use equal split in this version
                </BText>
              </BView>
            )}
          </BView>

          {/* Custom amount input for non-equal splits */}
          {showCustomInputs && (
            <BView gap={SpacingValue.XS}>
              <BText variant={TextVariant.LABEL}>{inputLabel}</BText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.backgroundSecondary,
                    borderColor: validationError ? themeColors.error : themeColors.border,
                  },
                ]}
                value={friendOwedInput}
                onChangeText={setFriendOwedInput}
                keyboardType="decimal-pad"
                placeholder={effectiveSplitType === 'percentage' ? '50' : effectiveSplitType === 'shares' ? '1' : ''}
                placeholderTextColor={themeColors.textMuted}
              />
              {validationError ? (
                <BText variant={TextVariant.CAPTION} style={{ color: themeColors.error }}>
                  {validationError}
                </BText>
              ) : (
                <BText variant={TextVariant.CAPTION} muted>
                  You owe: ₹
                  {(totalAmount - computeFriendOwed(effectiveSplitType, friendOwedNum, totalAmount)).toFixed(2)}
                </BText>
              )}
            </BView>
          )}
        </>
      )}
    </BView>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeFriendOwed(splitType: SplitType, input: number, total: number): number {
  switch (splitType) {
    case 'exact':
      return input;
    case 'percentage':
      return (total * input) / 100;
    case 'shares':
      // 1 friend share vs 1 user share (2 total by default)
      // We treat the input as friend's share count, user gets 1 share
      return input > 0 ? (total * input) / (input + 1) : 0;
    default:
      return total / 2;
  }
}

function getValidationError(splitType: SplitType, input: number, total: number): string | null {
  if (input <= 0) return 'Enter a value greater than 0';
  if (splitType === 'exact' && input >= total) return `Must be less than ₹${total.toFixed(2)}`;
  if (splitType === 'percentage' && input >= 100) return 'Must be less than 100%';
  return null;
}

function buildConfig(
  target: SplitTarget,
  splitType: SplitType,
  totalAmount: number,
  currentUserId: number,
  friendOwedInput: string
): SplitConfig | null {
  const groupId = target.type === 'group' ? target.splitwiseId : null;

  if (splitType === 'equal') {
    return {
      totalAmount,
      description: '',
      date: new Date().toISOString().split('T')[0],
      groupId,
      splitType: 'equal',
      participants: [],
    };
  }

  const friendOwedNum = parseFloat(friendOwedInput) || 0;
  if (friendOwedNum <= 0) return null;
  if (getValidationError(splitType, friendOwedNum, totalAmount)) return null;

  const friendOwed = computeFriendOwed(splitType, friendOwedNum, totalAmount);
  const userOwed = totalAmount - friendOwed;

  return {
    totalAmount,
    description: '',
    date: new Date().toISOString().split('T')[0],
    groupId,
    splitType,
    participants: [
      { userId: currentUserId, paidShare: totalAmount, owedShare: userOwed },
      { userId: target.splitwiseId, paidShare: 0, owedShare: friendOwed },
    ],
  };
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius[SpacingValue.BASE]!,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
});

export default SplitForm;
