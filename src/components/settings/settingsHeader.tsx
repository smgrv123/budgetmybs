import { BButton, BIcon, BText, BView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useRouter } from 'expo-router';

type SettingsHeaderProps = {
  title: string;
  onBack?: () => void;
};

export default function SettingsHeader({ title, onBack }: SettingsHeaderProps) {
  const router = useRouter();
  const themeColors = useThemeColors();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <BView row align="center" gap="sm" paddingY="md">
      <BButton variant="ghost" onPress={handleBack} padding="xs">
        <BIcon name="chevron-back" size="md" color={themeColors.text} />
      </BButton>
      <BText variant="heading">{title}</BText>
    </BView>
  );
}
