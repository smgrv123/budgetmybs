import type { FC } from 'react';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { ChatMessage } from '@/db/schema-types';
import { ChatRoleEnum } from '@/db/types';
import { BButton, BIcon, BText, BView } from '@/src/components/ui';
import { ButtonVariant, FontSize, IconSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatDate } from '@/src/utils/date';

interface ChatBubbleProps {
  message: ChatMessage;
  quotedMessage?: ChatMessage | null;
  onQuote?: (message: ChatMessage) => void;
}

const ChatBubble: FC<ChatBubbleProps> = ({ message, quotedMessage, onQuote }) => {
  const themeColors = useThemeColors();
  const isUser = message.role === ChatRoleEnum.USER;
  const swipeableRef = useRef<SwipeableMethods>(null);

  const bubbleBg = isUser ? themeColors.chatUserBubble : themeColors.chatBotBubble;
  const textColor = isUser ? themeColors.chatUserText : themeColors.chatBotText;

  const renderLeftActions = () => (
    <BView style={styles.swipeAction}>
      <BIcon name="arrow-undo-outline" size={IconSize.md} color={themeColors.primary} />
    </BView>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={() => {
        onQuote?.(message);
        swipeableRef.current?.close();
      }}
      overshootLeft={false}
    >
      <BButton
        variant={ButtonVariant.GHOST}
        onLongPress={() => onQuote?.(message)}
        style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}
      >
        <BView
          padding={SpacingValue.MD}
          rounded={SpacingValue.LG}
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, { backgroundColor: bubbleBg }]}
        >
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

          <BText variant={TextVariant.BODY} color={textColor}>
            {message.content}
          </BText>
        </BView>

        <BText
          variant={TextVariant.CAPTION}
          color={themeColors.chatTimestamp}
          style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampBot]}
        >
          {formatDate(message.createdAt, 'h:mm A')}
        </BText>
      </BButton>
    </ReanimatedSwipeable>
  );
};

export default ChatBubble;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.xxs,
    marginHorizontal: Spacing.md,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'column',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
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
  swipeAction: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
