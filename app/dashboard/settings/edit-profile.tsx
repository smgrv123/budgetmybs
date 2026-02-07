import { Colors } from '@/constants/theme';
import { clearUserData } from '@/db';
import { DebtPayoffPreferenceEnum } from '@/db/types';
import ProfileStep from '@/src/components/onboarding/steps/profileStep';
import { SettingsHeader } from '@/src/components/settings';
import { BButton, BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useProfile } from '@/src/hooks';
import type { ProfileData } from '@/src/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { profile: dbProfile, upsertProfileAsync } = useProfile();

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

  const handleSaveProfile = async () => {
    try {
      await upsertProfileAsync({
        name: profile.name,
        salary: profile.salary,
        frivolousBudget: profile.frivolousBudget,
        monthlySavingsTarget: profile.monthlySavingsTarget,
        debtPayoffPreference: profile.debtPayoffPreference,
      });
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account?', 'This will permanently delete all your data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await clearUserData('delete');
          if (result.success) {
            // Navigate to onboarding or login
            router.replace('/onboarding/welcome');
          } else {
            Alert.alert('Error', result.message);
          }
        },
      },
    ]);
  };

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <SettingsHeader title="Edit Profile" />

      <BView flex padding="base">
        <ProfileStep
          onNext={handleSaveProfile}
          errors={errors}
          setErrors={setErrors}
          profile={profile}
          onProfileChange={updateProfileField}
          submitLabel="Save Changes"
          heading="Update Your Profile"
          subheading="Make changes to your profile information"
        />

        {/* Delete Account Button */}
        <BView paddingY="xl">
          <BButton variant="ghost" onPress={handleDeleteAccount}>
            <BText variant="label" color={Colors.light.error}>
              Delete Account
            </BText>
          </BButton>
        </BView>
      </BView>
    </BSafeAreaView>
  );
}
