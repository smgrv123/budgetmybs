import type { TextVariantType } from '@/src/constants/theme';
import { TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useRouter } from 'expo-router';
import BButton from './button';
import BIcon from './icon';
import BText from './text';
import BView from './view';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** Text variant for the title. Defaults to 'heading'. */
  titleVariant?: TextVariantType;
};

export default function ScreenHeader({ title, onBack, titleVariant = TextVariant.HEADING }: ScreenHeaderProps) {
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
      <BText variant={titleVariant}>{title}</BText>
    </BView>
  );
}
