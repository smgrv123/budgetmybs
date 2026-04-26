/**
 * SplitConfig
 *
 * Renders the "Split with Splitwise" UI embedded inside AddTransactionModal.
 * Supports 4 split types: Equal, Exact, Percentage, Shares.
 *
 * Target picker design:
 *  - Group picker (single-select BDropdown, optional): user picks at most one group.
 *    When a group is selected, the member multi-select appears below it.
 *  - Friends multi-select (BMultiSelect): separate section for direct friends.
 *    Friends can be added even when a group is selected.
 *
 * Group filtering rules:
 *  - Remove groups with id === 0 (Splitwise non-group sentinel).
 *  - Remove groups where the current user is the only member or has 0 members.
 *
 * All 4 split types work for N people — form renders input rows per member.
 */

import type { FC } from 'react';
import { StyleSheet } from 'react-native';

import { BButton, BDropdown, BInput, BMultiSelect, BText, BView } from '@/src/components/ui';
import { SPLITWISE_OUTBOUND_STRINGS, SplitType } from '@/src/constants/splitwise-outbound.strings';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useSplitTargets } from '@/src/hooks/useSplitTargets';
import { useSplitwise } from '@/src/hooks/useSplitwise';
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

export type SplitConfigProps = {
  state: SplitFormState;
  onChange: (updates: Partial<SplitFormState>) => void;
  totalAmount: number;
};

// ============================================
// HELPERS
// ============================================

type ParsedTarget = { kind: 'group'; id: string } | { kind: 'friend'; id: string };

const parseTargetValue = (val: string): ParsedTarget | null => {
  if (val.startsWith('group:')) return { kind: 'group', id: val.replace('group:', '') };
  if (val.startsWith('friend:')) return { kind: 'friend', id: val.replace('friend:', '') };
  return null;
};

// ============================================
// COMPONENT
// ============================================

const SplitConfig: FC<SplitConfigProps> = ({ state, onChange, totalAmount }) => {
  const themeColors = useThemeColors();
  const { friends, isFriendsLoading, groups, isGroupsLoading } = useSplitTargets();
  const { currentUser } = useSplitwise();

  const isLoading = isFriendsLoading || isGroupsLoading;

  // Filter groups:
  //  1. Remove sentinel group with id === 0.
  //  2. Remove groups where the current user is the only member or has 0 members.
  const filteredGroups = groups.filter((g) => {
    if (g.id === 0) return false;
    const members = g.members ?? [];
    if (members.length === 0) return false;
    if (members.length === 1 && currentUser && members[0]?.id === currentUser.id) return false;
    return true;
  });

  // Group options for the single-select group picker
  const groupOptions = filteredGroups.map((g) => ({
    label: g.name,
    value: `group:${g.id}`,
  }));

  // Friends options for the multi-select friends picker
  const friendOptions = friends.map((f) => ({
    label: [f.first_name, f.last_name].filter(Boolean).join(' '),
    value: `friend:${f.id}`,
  }));

  // Derive the current group picker value from state.groupId only
  const selectedTargetValue = state.groupId ? `group:${state.groupId}` : null;

  // Friends multi-select value from state.friendIds
  const selectedFriendValues = (state.friendIds ?? []).map((id) => `friend:${id}`);

  const handleGroupChange = (val: string | number | boolean) => {
    const parsed = parseTargetValue(String(val));
    if (parsed?.kind === 'group') {
      const group = filteredGroups.find((g) => String(g.id) === parsed.id);
      const memberIds = (group?.members ?? []).map((m) => String(m.id));
      onChange({
        groupId: parsed.id,
        selectedMemberIds: memberIds,
        exactAmounts: {},
        percentages: {},
        shares: {},
      });
    }
  };

  const handleGroupClear = () => {
    onChange({ groupId: null, selectedMemberIds: [] });
  };

  const handleFriendsChange = (vals: (string | number)[]) => {
    const friendIds = vals
      .map((v) => parseTargetValue(String(v)))
      .filter((p): p is ParsedTarget => p?.kind === 'friend')
      .map((p) => p.id);
    onChange({ friendIds });
  };

  // When a group is selected, find it and build member options for BMultiSelect
  const selectedGroup = state.groupId ? filteredGroups.find((g) => String(g.id) === state.groupId) : null;

  const allGroupMemberOptions = (selectedGroup?.members ?? []).map((m) => ({
    label: [m.first_name, m.last_name].filter(Boolean).join(' '),
    value: String(m.id),
  }));

  // All member IDs from the selected group (as strings)
  // const allGroupMemberIds = allGroupMemberOptions.map((m) => m.value);

  // The effective member IDs in the split:
  //  - group members (resolved) when a group is selected
  //  - direct friendIds (always included)
  //  - union of both when a group AND direct friends are selected
  const groupMemberIds = selectedGroup ? state.selectedMemberIds : [];

  const directFriendIds = state.friendIds ?? [];

  // Union: group members + direct friends, deduplicated
  const activeMemberIds = [...new Set([...groupMemberIds, ...directFriendIds])];

  // Member label lookup for display
  const memberLabelMap = new Map<string, string>(allGroupMemberOptions.map((m) => [String(m.value), m.label]));
  // Add friend labels for direct friend splits
  for (const friendId of state.friendIds ?? []) {
    if (!memberLabelMap.has(friendId)) {
      const friend = friends.find((f) => String(f.id) === friendId);
      if (friend) {
        memberLabelMap.set(friendId, [friend.first_name, friend.last_name].filter(Boolean).join(' '));
      }
    }
  }

  const getMemberLabel = (memberId: string): string => {
    const base = memberLabelMap.get(memberId) ?? memberId;
    const suffix =
      currentUser && String(currentUser.id) === memberId ? SPLITWISE_OUTBOUND_STRINGS.memberRowYouSuffix : '';
    return `${base}${suffix}`;
  };

  // ── Equal split ─────────────────────────────────────────────────────────────
  const memberCount = activeMemberIds.length > 0 ? activeMemberIds.length : 1;
  // payer + members; if payer is already in activeMemberIds, total = activeMemberIds.length
  const payerInMembers = currentUser !== null && activeMemberIds.includes(String(currentUser?.id));
  const equalSplitCount = payerInMembers ? memberCount : memberCount + 1;
  const equalShare = totalAmount > 0 ? (totalAmount / equalSplitCount).toFixed(2) : '0.00';

  // ── Per-member input handlers ────────────────────────────────────────────────
  const updateMemberMap = (mapKey: 'exactAmounts' | 'percentages' | 'shares', memberId: string, value: string) => {
    onChange({ [mapKey]: { ...state[mapKey], [memberId]: value } });
  };

  const activeMemberRenderer = (memberId: string, memberLabel: string) => {
    switch (state.splitType) {
      case SplitType.EXACT:
        return (
          <BView key={memberId} gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{memberLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.memberAmountPlaceholder}
              value={state.exactAmounts[memberId] ?? ''}
              onChangeText={(val) => updateMemberMap('exactAmounts', memberId, val)}
              keyboardType="decimal-pad"
            />
          </BView>
        );
      case SplitType.PERCENTAGE:
        return (
          <BView key={memberId} gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{memberLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.memberPercentagePlaceholder}
              value={state.percentages[memberId] ?? ''}
              onChangeText={(val) => updateMemberMap('percentages', memberId, val)}
              keyboardType="decimal-pad"
            />
          </BView>
        );
      case SplitType.SHARES:
        return (
          <BView key={memberId} gap={SpacingValue.XS}>
            <BText variant={TextVariant.LABEL}>{memberLabel}</BText>
            <BInput
              placeholder={SPLITWISE_OUTBOUND_STRINGS.memberSharesPlaceholder}
              value={state.shares[memberId] ?? ''}
              onChangeText={(val) => updateMemberMap('shares', memberId, val)}
              keyboardType="decimal-pad"
            />
          </BView>
        );
      default:
        return null;
    }
  };

  return (
    <BView gap={SpacingValue.SM} style={[styles.container, { borderColor: themeColors.border }]}>
      <BText variant={TextVariant.LABEL} color={themeColors.primary}>
        {SPLITWISE_OUTBOUND_STRINGS.splitToggleLabel}
      </BText>

      {/* Group picker (single-select, optional) */}
      <BView gap={SpacingValue.XS}>
        <BView row align="center" justify="space-between">
          <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.groupOnlyPickerLabel}</BText>
          {state.groupId && (
            <BButton variant="ghost" size="sm" onPress={handleGroupClear}>
              <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
                {SPLITWISE_OUTBOUND_STRINGS.groupOnlyPickerClear}
              </BText>
            </BButton>
          )}
        </BView>
        <BDropdown
          options={groupOptions}
          value={selectedTargetValue}
          onValueChange={handleGroupChange}
          placeholder={
            isLoading
              ? SPLITWISE_OUTBOUND_STRINGS.loadingGroups
              : groupOptions.length === 0
                ? SPLITWISE_OUTBOUND_STRINGS.noGroupsFound
                : SPLITWISE_OUTBOUND_STRINGS.groupOnlyPickerPlaceholder
          }
          modalTitle={SPLITWISE_OUTBOUND_STRINGS.groupOnlyPickerModalTitle}
          searchable={true}
          disabled={isLoading || groupOptions.length === 0}
        />
      </BView>

      {/* Group member multi-picker — shown only when a group is selected */}
      {selectedGroup && (
        <BView gap={SpacingValue.XS}>
          <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerLabel}</BText>
          <BMultiSelect
            options={allGroupMemberOptions}
            value={state.selectedMemberIds}
            onValueChange={(vals) => {
              onChange({
                selectedMemberIds: vals.map(String),
                exactAmounts: {},
                percentages: {},
                shares: {},
              });
            }}
            placeholder={SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerPlaceholder}
            modalTitle={SPLITWISE_OUTBOUND_STRINGS.groupMemberPickerModalTitle}
            searchable={true}
            disabled={allGroupMemberOptions.length === 0}
          />
        </BView>
      )}

      {/* Friends multi-select */}
      <BView gap={SpacingValue.XS}>
        <BText variant={TextVariant.LABEL}>{SPLITWISE_OUTBOUND_STRINGS.friendsMultiSelectLabel}</BText>
        <BMultiSelect
          options={friendOptions}
          value={selectedFriendValues}
          onValueChange={handleFriendsChange}
          placeholder={
            isLoading
              ? SPLITWISE_OUTBOUND_STRINGS.loadingFriends
              : friendOptions.length === 0
                ? SPLITWISE_OUTBOUND_STRINGS.noFriendsFound
                : SPLITWISE_OUTBOUND_STRINGS.friendsMultiSelectPlaceholder
          }
          modalTitle={SPLITWISE_OUTBOUND_STRINGS.friendsMultiSelectModalTitle}
          searchable={true}
          disabled={isLoading || friendOptions.length === 0}
        />
      </BView>

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
      {state.splitType === SplitType.EQUAL && activeMemberIds.length > 0 && (
        <BView gap={SpacingValue.XS} padding={SpacingValue.SM} rounded="base" bg={themeColors.backgroundSecondary}>
          <BText variant={TextVariant.CAPTION} color={themeColors.textSecondary}>
            {`${SPLITWISE_OUTBOUND_STRINGS.equalSharePreviewLabel}: \u20B9${equalShare} \u00D7 ${equalSplitCount}`}
          </BText>
        </BView>
      )}

      {/* Exact / Percentage / Shares — N-person input rows */}
      {state.splitType !== SplitType.EQUAL && activeMemberIds.length > 0 && (
        <BView gap={SpacingValue.SM}>
          {activeMemberIds.map((memberId) => {
            const memberLabel = getMemberLabel(memberId);
            return activeMemberRenderer(memberId, memberLabel);
          })}
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

export default SplitConfig;
