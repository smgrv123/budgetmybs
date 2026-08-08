import { ScrollView, StyleSheet } from 'react-native';

import { BButton, BIcon, BInput, BText, BView } from '@/src/components/ui';
import { OnboardingStrings } from '@/src/constants/onboarding.strings';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ProfileData } from '@/src/types';
import { parseFormattedNumber } from '@/src/utils/format';
import { profileSchema, validateForm } from '@/src/validation/onboarding';
import { Fragment } from 'react';
import { createProfileFields } from './profile';

const { profile: profileStrings } = OnboardingStrings;

export type ProfileStepProps = {
  onNext: () => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  // Make props required for controlled component usage
  profile: ProfileData;
  onProfileChange: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  // Optional customization for settings reuse
  submitLabel?: string;
  heading?: string;
  subheading?: string;
};

function ProfileStep({
  onNext,
  errors,
  setErrors,
  profile,
  onProfileChange,
  submitLabel = profileStrings.continueButton,
  heading = profileStrings.heading,
  subheading = profileStrings.subheading,
}: ProfileStepProps) {
  const handleContinue = () => {
    const result = validateForm(profileSchema, profile);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onNext();
  };

  const handleChange = (field: keyof typeof profile, text: string) => {
    if (field === 'name') {
      onProfileChange(field, text);
    } else {
      // Parse formatted number (removes commas) and convert to number
      const num = parseFormattedNumber(text);
      onProfileChange(field, num);
    }
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const profileFields = createProfileFields({
    profile,
    errors,
    handleChange,
  });

  const themeColors = useThemeColors();
  const isButtonDisabled = !profile.name || !profile.salary;

  return (
    <ScrollView>
      <BView flex gap="xl" style={styles.stepContainer}>
        <BView>
          <BText variant="heading">{heading}</BText>
          <BText variant="body" muted>
            {subheading}
          </BText>
        </BView>

        {profileFields.map((item, index) => {
          return (
            <Fragment key={index}>
              <BView gap="xs">
                {item.icon && (
                  <BView row gap="xs" align="center">
                    <BIcon name={item.icon as any} size="sm" color={themeColors.textMuted} />
                    <BText variant="label">{item.label}</BText>
                  </BView>
                )}
                <BInput
                  label={item.icon ? undefined : item.label}
                  placeholder={item.placeholder}
                  value={item.value}
                  onChangeText={item.onChangeText}
                  keyboardType={item.keyboardType}
                  autoCapitalize={item.autoCapitalize}
                  error={item.error}
                  helperText={item.helperText}
                  leftIcon={item.leftIcon}
                />
              </BView>
            </Fragment>
          );
        })}

        <BView>
          <BButton
            fullWidth
            onPress={handleContinue}
            disabled={isButtonDisabled}
            rounded="lg"
            paddingY="sm"
            style={isButtonDisabled ? { backgroundColor: themeColors.muted } : undefined}
          >
            <BText color="#FFFFFF" variant="label">
              {submitLabel}
            </BText>
          </BButton>
        </BView>
      </BView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
});

export default ProfileStep;
