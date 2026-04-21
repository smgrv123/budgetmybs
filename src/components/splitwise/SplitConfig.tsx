/**
 * SplitConfig
 *
 * Replaces SplitForm. Renders the "Split with Splitwise" UI.
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
// PAIR SPLIT CONFIGS
// ============================================

const PAIR_SPLIT_CONFIGS = [
  {
    splitType: SplitType.EXACT,
    yourLabel: SPLITWISE_OUTBOUND_STRINGS.yourExactAmountLabel,
    yourPlaceholder: SPLITWISE_OUTBOUND_STRINGS.yourExactAmountPlaceholder,
    yourStateKey: 'yourExactAmount' as const,
    friendLabel: SPLITWISE_OUTBOUND_STRINGS.friendExactAmountLabel,
    friendPlaceholder: SPLITWISE_OUTBOUND_STRINGS.friendExactAmountPlaceholder,
    friendStateKey: 'friendExactAmount' as const,
  },
  {
    splitType: SplitType.PERCENTAGE,
    yourLabel: SPLITWISE_OUTBOUND_STRINGS.yourPercentageLabel,
    yourPlaceholder: SPLITWISE_OUTBOUND_STRINGS.yourPercentagePlaceholder,
    yourStateKey: 'yourPercentage' as const,
    friendLabel: SPLITWISE_OUTBOUND_STRINGS.friendPercentageLabel,
    friendPlaceholder: SPLITWISE_OUTBOUND_STRINGS.friendPercentagePlaceholder,
    friendStateKey: 'friendPercentage' as const,
  },
  {
    splitType: SplitType.SHARES,
    yourLabel: SPLITWISE_OUTBOUND_STRINGS.yourSharesLabel,
    yourPlaceholder: SPLITWISE_OUTBOUND_STRINGS.yourSharesPlaceholder,
    yourStateKey: 'yourShares' as const,
    friendLabel: SPLITWISE_OUTBOUND_STRINGS.friendSharesLabel,
    friendPlaceholder: SPLITWISE_OUTBOUND_STRINGS.friendSharesPlaceholder,
    friendStateKey: 'friendShares' as const,
  },
] satisfies {
  splitType: SplitFormState['splitType'];
  yourLabel: string;
  yourPlaceholder: string;
  yourStateKey: keyof SplitFormState;
  friendLabel: string;
  friendPlaceholder: string;
  friendStateKey: keyof SplitFormState;
}[];

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

export type SplitConfigProps = {
  state: SplitFormState;
  onChange: (updates: Partial<SplitFormState>) => void;
  totalAmount: number;
};

// ============================================
// COMPONENT
// ============================================

const SplitConfig: FC<SplitConfigProps> = ({ state, onChange, totalAmount }) => {
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
            {`You: \u20B9${equalShare}  |  Friend: \u20B9${equalShare}`}
          </BText>
        </BView>
      )}

      {/* Exact / Percentage / Shares split inputs */}
      {PAIR_SPLIT_CONFIGS.map((cfg) =>
        state.splitType === cfg.splitType ? (
          <BView key={cfg.splitType} gap={SpacingValue.SM}>
            <BView gap={SpacingValue.XS}>
              <BText variant={TextVariant.LABEL}>{cfg.yourLabel}</BText>
              <BInput
                placeholder={cfg.yourPlaceholder}
                value={state[cfg.yourStateKey] as string}
                onChangeText={(val) => onChange({ [cfg.yourStateKey]: val })}
                keyboardType="decimal-pad"
              />
            </BView>
            <BView gap={SpacingValue.XS}>
              <BText variant={TextVariant.LABEL}>{cfg.friendLabel}</BText>
              <BInput
                placeholder={cfg.friendPlaceholder}
                value={state[cfg.friendStateKey] as string}
                onChangeText={(val) => onChange({ [cfg.friendStateKey]: val })}
                keyboardType="decimal-pad"
              />
            </BView>
          </BView>
        ) : null
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

export default SplitConfig;
