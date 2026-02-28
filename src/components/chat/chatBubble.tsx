import type { ChatMessage } from '@/db/schema-types';
import { ChatRoleEnum } from '@/db/types';
import { BText, BView } from '@/src/components/ui';
import { FontSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import dayjs from 'dayjs';
import { StyleSheet } from 'react-native';

interface ChatBubbleProps {
  message: ChatMessage;
  quotedMessage?: ChatMessage | null;
}

export default function ChatBubble({ message, quotedMessage }: ChatBubbleProps) {
  const themeColors = useThemeColors();
  const isUser = message.role === ChatRoleEnum.USER;

  const bubbleBg = isUser ? themeColors.chatUserBubble : themeColors.chatBotBubble;
  const textColor = isUser ? themeColors.chatUserText : themeColors.chatBotText;

  return (
    <BView style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
      <BView
        padding={SpacingValue.MD}
        rounded={SpacingValue.LG}
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, { backgroundColor: bubbleBg }]}
      >
        {/* Quoted message preview */}
        {quotedMessage && (
          <BView
            paddingX={SpacingValue.SM}
            paddingY={SpacingValue.XS}
            rounded={SpacingValue.MD}
            style={[styles.quotedBlock, { backgroundColor: themeColors.muted }]}
          >
            <BText variant={TextVariant.CAPTION} muted numberOfLines={1}>
              {quotedMessage.content}
            </BText>
          </BView>
        )}

        {/* Message text */}
        <BText variant={TextVariant.BODY} color={textColor}>
          {message.content}
        </BText>
      </BView>

      {/* Timestamp */}
      <BText
        variant={TextVariant.CAPTION}
        color={themeColors.chatTimestamp}
        style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampBot]}
      >
        {dayjs(message.createdAt).format('h:mm A')}
      </BText>
    </BView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.xxs,
    marginHorizontal: Spacing.md,
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  wrapperBot: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    gap: Spacing.xs,
  },
  bubbleUser: {
    borderBottomRightRadius: Spacing.xxs,
  },
  bubbleBot: {
    borderBottomLeftRadius: Spacing.xxs,
  },
  quotedBlock: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  timestamp: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
  },
  timestampUser: {
    marginRight: Spacing.xs,
  },
  timestampBot: {
    marginLeft: Spacing.xs,
  },
});
