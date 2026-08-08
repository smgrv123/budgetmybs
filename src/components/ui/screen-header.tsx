import type { TextVariantType } from '@/src/constants/theme';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { FC } from 'react';
import { ViewStyle } from 'react-native';
import BButton from './button';
import BIcon from './icon';
import BText from './text';
import BView from './view';

type HeaderAction = {
  icon: string;
  onPress: () => void;
  color?: string;
};

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** Text variant for the title. Defaults to 'heading'. */
  titleVariant?: TextVariantType;
  /** Data-driven action buttons rendered on the right side. */
  actions?: HeaderAction[];
  /** container styles to override base styles*/
  containerStyles?: ViewStyle;
};

const ScreenHeader: FC<ScreenHeaderProps> = ({
  title,
  onBack,
  titleVariant = TextVariant.HEADING,
  actions,
  containerStyles,
}) => {
  const router = useRouter();
  const themeColors = useThemeColors();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const hasActions = actions && actions.length > 0;

  return (
    <BView row align="center" justify={hasActions ? 'space-between' : undefined} paddingY="md" style={containerStyles}>
      <BView row align="center" gap="sm" flex>
        <BButton variant="ghost" onPress={handleBack} padding="xs">
          <BIcon name="chevron-back" size="md" color={themeColors.text} />
        </BButton>
        <BText variant={titleVariant}>{title}</BText>
      </BView>
      {hasActions && (
        <BView row gap={SpacingValue.SM}>
          {actions.map((action) => (
            <BButton key={action.icon} variant={ButtonVariant.GHOST} onPress={action.onPress} padding={SpacingValue.XS}>
              <BIcon name={action.icon as any} size="base" color={action.color ?? themeColors.textMuted} />
            </BButton>
          ))}
        </BView>
      )}
    </BView>
  );
};

export default ScreenHeader;
