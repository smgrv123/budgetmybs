/**
 * SplitForm
 *
 * Renders the "Split with Splitwise" UI embedded inside AddTransactionModal.
 * Supports 4 split types: Equal, Exact, Percentage, Shares.
 * Shows groups first, then friends. When a group is selected, a second
 * member picker appears so the user can choose which group member to split with.
 * MVP scope: payer + 1 friend/member only.
 */

import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { SPLITWISE_OUTBOUND_STRINGS, SplitType } from '@/src/constants/splitwise-outbound.strings';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitTargets } from '@/src/hooks/useSplitTargets';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BDropdown, BInput, BText, BView } from '@/src/components/ui';
import type { SplitFormState } from '@/src/types/splitwise-outbound';

// ============================================
// SPLIT TYPE OPTIONS
// ============================================

const SPLIT_TYPE_OPTIONS = [
  { label: SPLITWISE_OUTBOUND_STRINGS.splitTypeEqual, value: SplitType.EQUAL },
  { label: SPLITWISE_OUTBOUND_STRINGS.splitTypeExact, value: SplitType.EXACT },
  { label: SPLITWISE_OUTBOUND_STRINGS.splitTypePercentage, value: SplitType.PERCENTAGE },
  { label: SPLITWISE_OUTBOUND_STRINGS.splitTypeShares, value: SplitType.SHARES },
];

// ============================================
// PROPS
// ============================================

export type SplitFormProps = {
  state: SplitFormState;
  onChange: (updates: Partial<SplitFormState>) => void;
  totalAmount: number;
};

// ============================================
// COMPONENT
// ============================================

const SplitForm: FC<SplitFormProps> = ({ state, onChange, totalAmount }) => {
  const themeColors = useThemeColors();
  const { friends, isFriendsLoading, groups, isGroupsLoading } = useSplitTargets();

  const isLoading = isFriendsLoading || isGroupsLoading;

  // Groups first, then friends — prefix values to distinguish
  const targetOptions = [
    ...groups.map((g) => ({
      label: g.name,
      value: `group:${g.id}`,
    })),
    ...friends.map((f) => ({
      label: [f.first_name, f.last_name].filter(Boolean).join(' '),
      value: `friend:${f.id}`,
    })),
  ];

  // Derive the current combined picker value from state
  const selectedTargetValue = state.groupId
    ? `group:${state.groupId}`
    : state.friendId
      ? `friend:${state.friendId}`
      : null;

  const handleTargetChange = (val: string | number | boolean) => {
    const strVal = String(val);
    if (strVal.startsWith('group:')) {
      const gId = strVal.replace('group:', '');
      onChange({ groupId: gId, friendId: null });
    } else if (strVal.startsWith('friend:')) {
      const fId = strVal.replace('friend:', '');
      onChange({ groupId: null, friendId: fId });
    }
  };

  // When a group is selected, find it and build member options
  const selectedGroup = state.groupId ? groups.find((g) => String(g.id) === state.groupId) : null;

  const memberOptions =
    selectedGroup?.members?.map((m) => ({
      label: [m.first_name, m.last_name].filter(Boolean).join(' '),
      value: String(m.id),
    })) ?? [];

  const equalShare = totalAmount > 0 ? (totalAmount / 2).toFixed(2) : '0.00';

  return (
    <BView gap={SpacingValue.SM} style={[styles.container, { borderColor: themeColors.border }]}>
      <BText variant={TextVariant.LABEL} color={themeColors.primary}>
        {SPLITWISE_OUTBOUND_STRINGS.splitToggleLabel}
      </BText>

      {/* Combined group / friend picker */}
      <BView gap={SpacingValue.XS}>
        <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.groupPickerLabel}</BText>
        <BDropdown
          options={targetOptions}
          value={selectedTargetValue}
          onValueChange={handleTargetChange}
          placeholder={
            isLoading
              ? SPLITWISE_OUTBOUND_STRINGS.loadingGroups
              : targetOptions.length === 0
                ? SPLITWISE_OUTBOUND_STRINGS.noGroupsOrFriendsFound
                : SPLITWISE_OUTBOUND_STRINGS.groupPickerPlaceholder
          }
          modalTitle={SPLITWISE_OUTBOUND_STRINGS.groupPickerModalTitle}
          searchable={true}
          disabled={isLoading || targetOptions.length === 0}
        />
      </BView>

      {/* Group member picker — shown only when a group is selected */}
      {selectedGroup && (
        <BView gap={SpacingValue.XS}>
          <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerLabel}</BText>
          <BDropdown
            options={memberOptions}
            value={state.friendId ?? null}
            onValueChange={(val) => onChange({ friendId: String(val) })}
            placeholder={SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerPlaceholder}
            modalTitle={SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerModalTitle}
            searchable={true}
            disabled={memberOptions.length === 0}
          />
        </BView>
      )}

      {/* Split type selector */}
      <BView gap={SpacingValue.XS}>
        <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.splitTypeLabel}</BText>
        <BDropdown
          options={SPLIT_TYPE_OPTIONS}
          value={state.splitType}
          onValueChange={(val) => onChange({ splitType: val as SplitFormState['splitType'] })}
          modalTitle={SPLITWISE_OUTBOUND_STRINGS.splitTypeLabel}
        />
      </BView>

      {/* Equal split preview */}
      {state.splitType === SplitType.EQUAL && (
        <BView gap={SpacingValue.XS} padding={SpacingValue.SM} rounded="base" bg={themeColors.backgroundSecondary}>
          <BText variant={TextVariant.CAPTION} color={themeColors.textSecondary}>
            {`You: ₹${equalShare}  |  Friend: ₹${equalShare}`}
          </BText>
        </BView>
      )}

      {/* Exact split inputs */}
      {state.splitType === SplitType.EXACT && (
        <BView gap={SpacingValue.SM}>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.yourExactAmountLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.yourExactAmountPlaceholder}
              value={state.yourExactAmount}
              onChangeText={(val) => onChange({ yourExactAmount: val })}
              keyboardType="decimal-pad"
            />
          </BView>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.friendExactAmountLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.friendExactAmountPlaceholder}
              value={state.friendExactAmount}
              onChangeText={(val) => onChange({ friendExactAmount: val })}
              keyboardType="decimal-pad"
            />
          </BView>
        </BView>
      )}

      {/* Percentage split inputs */}
      {state.splitType === SplitType.PERCENTAGE && (
        <BView gap={SpacingValue.SM}>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.yourPercentageLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.yourPercentagePlaceholder}
              value={state.yourPercentage}
              onChangeText={(val) => onChange({ yourPercentage: val })}
              keyboardType="decimal-pad"
            />
          </BView>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.friendPercentageLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.friendPercentagePlaceholder}
              value={state.friendPercentage}
              onChangeText={(val) => onChange({ friendPercentage: val })}
              keyboardType="decimal-pad"
            />
          </BView>
        </BView>
      )}

      {/* Shares split inputs */}
      {state.splitType === SplitType.SHARES && (
        <BView gap={SpacingValue.SM}>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.yourSharesLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.yourSharesPlaceholder}
              value={state.yourShares}
              onChangeText={(val) => onChange({ yourShares: val })}
              keyboardType="decimal-pad"
            />
          </BView>
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.friendSharesLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.friendSharesPlaceholder}
              value={state.friendShares}
              onChangeText={(val) => onChange({ friendShares: val })}
              keyboardType="decimal-pad"
            />
          </BView>
        </BView>
      )}
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
});

export default SplitForm;
