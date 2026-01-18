import { clearUserData } from '@/db';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

export const useAccount = () => {
  const deleteMutation = useMutation({
    mutationFn: () => clearUserData(),
    onSuccess: () => {
      router.replace('/onboarding/welcome');
    },
  });

  return {
    clearUserDataMutation: deleteMutation.mutateAsync,
    isClearingUserData: deleteMutation.isPending,
  };
};
