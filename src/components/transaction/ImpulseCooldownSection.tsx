import type { FC } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BButton, BInput, BSwitch, BText, BView } from '@/src/components/ui';
import { CooldownPreset, PRESET_DEFINITIONS, UNIT_OPTIONS } from '@/src/constants/impulse.config';
import { IMPULSE_STRINGS } from '@/src/constants/impulse.strings';
import { BorderRadius, ButtonVariant, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { CooldownPresetType, CooldownUnitType } from '@/src/types/impulse';

// ─── Props ────────────────────────────────────────────────────────────────────

export type ImpulseCooldownSectionProps = {
  /** Whether the impulse toggle is on */
  isImpulse: boolean;
  onToggleImpulse: (value: boolean) => void;
  /** Currently selected preset (or null if none) */
  selectedPreset: CooldownPresetType | null;
  onPresetChange: (preset: CooldownPresetType) => void;
  /** Custom duration value (shown when CUSTOM preset is selected) */
  customValue: string;
  onCustomValueChange: (value: string) => void;
  /** Custom duration unit */
  customUnit: CooldownUnitType;
  onCustomUnitChange: (unit: CooldownUnitType) => void;
  /** Called when the override link is pressed */
  onOverridePress: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ImpulseCooldownSection: FC<ImpulseCooldownSectionProps> = ({
  isImpulse,
  onToggleImpulse,
  selectedPreset,
  onPresetChange,
  customValue,
  onCustomValueChange,
  customUnit,
  onCustomUnitChange,
  onOverridePress,
}) => {
  const themeColors = useThemeColors();

  return (
    <BView gap={SpacingValue.SM} marginY={SpacingValue.SM}>
      {/* Toggle row */}
      <BView flex row align="center" justify="space-between">
        <BView style={{ flex: 5 }}>
          <BText variant={TextVariant.LABEL}>{IMPULSE_STRINGS.toggleLabel}</BText>
          <BText variant={TextVariant.CAPTION} muted>
            {IMPULSE_STRINGS.toggleDescription}
          </BText>
        </BView>
        <BView style={{ flex: 1 }}>
          <BSwitch value={isImpulse} onValueChange={onToggleImpulse} />
        </BView>
      </BView>

      {/* Expanded section — only shown when toggle is on */}
      {isImpulse && (
        <BView gap={SpacingValue.SM}>
          {/* Disclaimer card */}
          <BView
            padding={SpacingValue.SM}
            rounded="base"
            style={[
              styles.disclaimerCard,
              { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning },
            ]}
          >
            <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
              {IMPULSE_STRINGS.disclaimer}
            </BText>
            <BButton
              variant={ButtonVariant.GHOST}
              onPress={onOverridePress}
              paddingX={SpacingValue.NONE}
              paddingY={SpacingValue.XS}
              style={styles.overrideButton}
            >
              <BText variant={TextVariant.CAPTION} color={themeColors.primary} style={styles.overrideLinkText}>
                {IMPULSE_STRINGS.overrideLink}
              </BText>
            </BButton>
          </BView>

          {/* Timer preset chips */}
          <BText variant={TextVariant.LABEL}>{IMPULSE_STRINGS.timerSectionLabel}</BText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {PRESET_DEFINITIONS.map(({ preset, label }) => {
              const isSelected = selectedPreset === preset;
              return (
                <BButton
                  key={preset}
                  onPress={() => onPresetChange(preset)}
                  variant={isSelected ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE}
                  paddingX={SpacingValue.SM}
                  paddingY={SpacingValue.XS}
                  style={styles.presetChip}
                >
                  <BText variant={TextVariant.CAPTION} color={isSelected ? themeColors.white : themeColors.primary}>
                    {label}
                  </BText>
                </BButton>
              );
            })}
          </ScrollView>

          {/* Custom duration picker — only when CUSTOM preset selected */}
          {selectedPreset === CooldownPreset.CUSTOM && (
            <BView gap={SpacingValue.XS}>
              <BText variant={TextVariant.LABEL}>{IMPULSE_STRINGS.customDurationLabel}</BText>
              <BView row gap={SpacingValue.SM} align="center">
                {/* Number input */}
                <BView style={styles.customValueInput}>
                  <BInput
                    value={customValue}
                    onChangeText={onCustomValueChange}
                    placeholder={IMPULSE_STRINGS.customAmountPlaceholder}
                    keyboardType="number-pad"
                  />
                </BView>

                {/* Unit selector chips */}
                <BView row gap={SpacingValue.XS}>
                  {UNIT_OPTIONS.map(({ label, value }) => {
                    const isSelected = customUnit === value;
                    return (
                      <BButton
                        key={value}
                        onPress={() => onCustomUnitChange(value)}
                        variant={isSelected ? ButtonVariant.PRIMARY : ButtonVariant.OUTLINE}
                        paddingX={SpacingValue.SM}
                        paddingY={SpacingValue.XS}
                        style={styles.unitChip}
                      >
                        <BText
                          variant={TextVariant.CAPTION}
                          color={isSelected ? themeColors.white : themeColors.primary}
                        >
                          {label}
                        </BText>
                      </BButton>
                    );
                  })}
                </BView>
              </BView>
            </BView>
          )}
        </BView>
      )}
    </BView>
  );
};

const styles = StyleSheet.create({
  disclaimerCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.base,
  },
  overrideButton: {
    alignSelf: 'flex-start',
  },
  overrideLinkText: {
    textDecorationLine: 'underline',
  },
  presetRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  presetChip: {
    borderRadius: BorderRadius.full,
  },
  customValueInput: {
    width: 80,
  },
  unitChip: {
    borderRadius: BorderRadius.full,
  },
});

export default ImpulseCooldownSection;
