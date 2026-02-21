import { ButtonVariant, ComponentSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { BButton, BIcon, BText, BView } from '@/src/components/ui';
import { useTheme } from '@/src/hooks/theme-hooks/use-color-scheme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { ThemePreference, type ThemePreferenceType } from '@/src/types';

const themeOptions = [
  { value: ThemePreference.SYSTEM, label: 'System Default', icon: 'phone-portrait-outline' },
  { value: ThemePreference.LIGHT, label: 'Light', icon: 'sunny-outline' },
  { value: ThemePreference.DARK, label: 'Dark', icon: 'moon-outline' },
] as const;

export default function ThemeSelector() {
  const { themePreference, setThemePreference } = useTheme();
  const themeColors = useThemeColors();

  const handleSelect = (value: ThemePreferenceType) => {
    setThemePreference(value);
  };

  return (
    <BView gap={SpacingValue.SM}>
      {themeOptions.map((option, index) => {
        const isSelected = themePreference === option.value;
        const isLast = index === themeOptions.length - 1;

        return (
          <BView key={option.value}>
            <BButton
              variant={ButtonVariant.GHOST}
              onPress={() => handleSelect(option.value)}
              padding={SpacingValue.BASE}
              rounded="xs"
            >
              <BView row align="center" gap={SpacingValue.MD} flex>
                <BIcon name={option.icon} size={ComponentSize.MD} color={themeColors.icon} />
                <BView flex>
                  <BText variant={TextVariant.BODY}>{option.label}</BText>
                </BView>
                <BIcon
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={ComponentSize.MD}
                  color={isSelected ? themeColors.primary : themeColors.border}
                />
              </BView>
            </BButton>
            {!isLast && (
              <BView
                bg={themeColors.border}
                style={{
                  height: 1,
                  marginLeft: Spacing[SpacingValue.XL],
                }}
              />
            )}
          </BView>
        );
      })}
    </BView>
  );
}
