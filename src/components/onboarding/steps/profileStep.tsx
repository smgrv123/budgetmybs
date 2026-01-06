import type { ReactNode } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { common, PROFILE_FIELD_CONFIGS } from '@/constants/setup-form.config';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { BButton, BIcon, BInput, BText, BView } from '@/src/components';
import { useOnboardingStore } from '@/src/store';
import { getFieldError, profileSchema, validateForm } from '@/src/validation/onboarding';

const { profile: profileStrings } = OnboardingStrings;

interface ProfileField {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  icon?: string;
}

export interface ProfileStepProps {
  onNext: () => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

function ProfileStep({ onNext, errors, setErrors }: ProfileStepProps) {
  const { profile, updateProfileField } = useOnboardingStore();

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
      updateProfileField(field, text);
    } else {
      const num = parseFloat(text) || 0;
      updateProfileField(field, num);
    }
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Create profile fields with dynamic values
  const currencyIcon = <BText muted>{common.currency}</BText>;
  const profileFields: ProfileField[] = PROFILE_FIELD_CONFIGS.map((config) => {
    const fieldValue =
      config.key === 'name'
        ? profile.name
        : profile[config.key as keyof typeof profile]
          ? String(profile[config.key as keyof typeof profile])
          : '';
    return {
      key: config.key,
      label: config.label,
      placeholder: config.placeholder,
      value: fieldValue,
      onChangeText: (text: string) => handleChange(config.key as keyof typeof profile, text),
      keyboardType: config.keyboardType,
      autoCapitalize: config.autoCapitalize,
      helperText: config.helperText,
      error: getFieldError(errors, config.key),
      leftIcon: config.hasCurrencyIcon ? currencyIcon : undefined,
      icon: config.icon,
    };
  });

  const isButtonDisabled = !profile.name || !profile.salary;

  return (
    <BView style={styles.stepContainer}>
      <BView style={styles.stepHeader}>
        <BText variant="heading">{profileStrings.heading}</BText>
        <BText variant="body" muted>
          {profileStrings.subheading}
        </BText>
      </BView>

      <FlatList
        data={profileFields}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <BView style={styles.fieldWrapper}>
            {item.icon && (
              <BView row gap="xs" style={styles.labelWithIcon}>
                <BIcon name={item.icon as any} size="sm" color={Colors.light.textMuted} />
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
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.fields}
      />

      <BView style={styles.stepFooter}>
        <BButton
          fullWidth
          onPress={handleContinue}
          disabled={isButtonDisabled}
          style={[styles.continueButton, isButtonDisabled && styles.buttonDisabled]}
        >
          <BText color="#FFFFFF" variant="label">
            {profileStrings.continueButton}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: Spacing.xl,
  },
  fields: {
    gap: Spacing.md,
  },
  fieldWrapper: {
    marginBottom: Spacing.md,
  },
  stepFooter: {
    marginTop: Spacing.xl,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.muted,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});

export default ProfileStep;
