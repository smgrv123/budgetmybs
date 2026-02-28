import { BIcon, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ComponentSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { Pressable } from 'react-native';

interface ChatHeaderProps {
  onClearHistory?: () => void;
}

export default function ChatHeader({ onClearHistory }: ChatHeaderProps) {
  const themeColors = useThemeColors();

  return (
    <BView
      row
      align="center"
      gap={SpacingValue.MD}
      paddingX={SpacingValue.BASE}
      paddingY={SpacingValue.SM}
      bg="background"
      border
    >
      {/* Avatar */}
      <BView
        center
        rounded="full"
        style={{
          width: 40,
          height: 40,
          backgroundColor: themeColors.primaryFaded,
        }}
      >
        <BIcon name="chatbubble-ellipses" size={ComponentSize.SM} color={themeColors.primary} />
      </BView>

      {/* Text */}
      <BView flex>
        <BText variant={TextVariant.SUBHEADING}>{CHAT_STRINGS.HEADER_TITLE}</BText>
        <BText variant={TextVariant.CAPTION} color={themeColors.success}>
          {CHAT_STRINGS.HEADER_STATUS}
        </BText>
      </BView>

      {/* Clear history */}
      {onClearHistory && (
        <Pressable onPress={onClearHistory} hitSlop={12} accessibilityLabel={CHAT_STRINGS.CLEAR_HISTORY_ACCESSIBLE}>
          <BIcon name="trash-outline" size={ComponentSize.SM} color={themeColors.textMuted} />
        </Pressable>
      )}
    </BView>
  );
}
