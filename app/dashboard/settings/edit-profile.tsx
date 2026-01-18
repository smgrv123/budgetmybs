import { Colors } from '@/constants/theme';
import { clearUserData } from '@/db';
import ProfileStep from '@/src/components/onboarding/steps/profileStep';
import { SettingsHeader } from '@/src/components/settings';
import { BButton, BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useProfile } from '@/src/hooks';
import { useOnboardingStore } from '@/src/store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { profile: dbProfile, upsertProfileAsync } = useProfile();
  const { profile: storeProfile, setProfile } = useOnboardingStore();

  // Pre-populate store from DB on mount
  useState(() => {
    if (dbProfile && !storeProfile.name) {
      setProfile({
        name: dbProfile.name,
        salary: dbProfile.salary,
        frivolousBudget: dbProfile.frivolousBudget,
        monthlySavingsTarget: dbProfile.monthlySavingsTarget,
      });
    }
  });

  const handleSaveProfile = async () => {
    try {
      await upsertProfileAsync({
        name: storeProfile.name,
        salary: storeProfile.salary,
        frivolousBudget: storeProfile.frivolousBudget,
        monthlySavingsTarget: storeProfile.monthlySavingsTarget,
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
            router.replace('/');
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
