import { clearUserData } from '@/db';
import { DebtPayoffPreferenceEnum } from '@/db/types';
import ProfileStep from '@/src/components/onboarding/steps/profileStep';
import { BButton, BSafeAreaView, BText, BView, ScreenHeader } from '@/src/components/ui';
import { EDIT_PROFILE_STRINGS, SETTINGS_COMMON_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, TextVariant } from '@/src/constants/theme';
import { useProfile } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { ProfileData } from '@/src/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { profile: dbProfile, upsertProfile } = useProfile();

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    salary: 0,
    monthlySavingsTarget: 0,
    frivolousBudget: 0,
    debtPayoffPreference: DebtPayoffPreferenceEnum.AVALANCHE,
  });

  // Pre-populate store from DB on mount
  useEffect(() => {
    if (dbProfile) {
      setProfile({
        name: dbProfile.name,
        salary: dbProfile.salary,
        frivolousBudget: dbProfile.frivolousBudget,
        monthlySavingsTarget: dbProfile.monthlySavingsTarget,
        debtPayoffPreference: dbProfile.debtPayoffPreference ?? DebtPayoffPreferenceEnum.AVALANCHE,
      });
    }
  }, [dbProfile]);

  const updateProfileField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    upsertProfile(
      {
        name: profile.name,
        salary: profile.salary,
        frivolousBudget: profile.frivolousBudget,
        monthlySavingsTarget: profile.monthlySavingsTarget,
        debtPayoffPreference: profile.debtPayoffPreference,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          console.error(EDIT_PROFILE_STRINGS.saveFailedLog, error);
          Alert.alert(SETTINGS_COMMON_STRINGS.errorAlertTitle, EDIT_PROFILE_STRINGS.saveFailedAlert);
        },
      }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(EDIT_PROFILE_STRINGS.deleteAccountTitle, EDIT_PROFILE_STRINGS.deleteAccountBody, [
      { text: EDIT_PROFILE_STRINGS.cancelButton, style: 'cancel' },
      {
        text: EDIT_PROFILE_STRINGS.deleteButton,
        style: 'destructive',
        onPress: async () => {
          const result = await clearUserData('delete');
          if (result.success) {
            // Navigate to onboarding or login
            router.replace(EDIT_PROFILE_STRINGS.postDeleteRedirect);
          } else {
            Alert.alert(SETTINGS_COMMON_STRINGS.errorAlertTitle, result.message);
          }
        },
      },
    ]);
  };

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={EDIT_PROFILE_STRINGS.screenTitle} />

      <BView flex padding="base">
        <ProfileStep
          onNext={handleSaveProfile}
          errors={errors}
          setErrors={setErrors}
          profile={profile}
          onProfileChange={updateProfileField}
          submitLabel={EDIT_PROFILE_STRINGS.saveButton}
          heading={EDIT_PROFILE_STRINGS.heading}
          subheading={EDIT_PROFILE_STRINGS.subheading}
        />

        {/* Delete Account Button */}
        <BView paddingY="xl">
          <BButton variant={ButtonVariant.GHOST} onPress={handleDeleteAccount}>
            <BText variant={TextVariant.LABEL} color={themeColors.error}>
              {EDIT_PROFILE_STRINGS.deleteAccountButton}
            </BText>
          </BButton>
        </BView>
      </BView>
    </BSafeAreaView>
  );
}
