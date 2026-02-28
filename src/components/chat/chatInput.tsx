import type { ChatMessage } from '@/db/schema-types';
import { BButton, BIcon, BInput, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, ComponentSize, InputVariant, Spacing, SpacingValue } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  isSending?: boolean;
  quotedMessage?: ChatMessage | null;
  onClearQuote?: () => void;
}

export default function ChatInput({ onSend, isSending, quotedMessage, onClearQuote }: ChatInputProps) {
  const themeColors = useThemeColors();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <BView bg="background" border paddingX={SpacingValue.SM} paddingY={SpacingValue.SM} style={styles.container}>
      {/* Quote preview strip */}
      {quotedMessage && (
        <BView
          row
          align="center"
          paddingX={SpacingValue.SM}
          paddingY={SpacingValue.XS}
          rounded={SpacingValue.MD}
          gap={SpacingValue.SM}
          style={[styles.quoteStrip, { backgroundColor: themeColors.muted }]}
        >
          <BText style={styles.quoteText} numberOfLines={1}>
            {quotedMessage.content}
          </BText>
          <BButton variant={ButtonVariant.GHOST} onPress={onClearQuote} style={styles.clearBtn}>
            <BIcon name="close" size={ComponentSize.SM} color={themeColors.textMuted} />
          </BButton>
        </BView>
      )}

      {/* Input row */}
      <BView row align="center" gap={SpacingValue.SM}>
        <BInput
          variant={InputVariant.FILLED}
          placeholder={CHAT_STRINGS.INPUT_PLACEHOLDER}
          size={ComponentSize.MD}
          rounded={SpacingValue.LG}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
          containerStyle={styles.inputContainer}
        />
        <BButton
          variant={ButtonVariant.PRIMARY}
          fullRounded
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          accessibilityLabel={CHAT_STRINGS.SEND_BUTTON_ACCESSIBLE}
          style={styles.sendBtn}
        >
          <BIcon name="send" size={ComponentSize.SM} color={themeColors.white} />
        </BButton>
      </BView>
    </BView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  quoteStrip: {
    marginBottom: Spacing.sm,
  },
  quoteText: {
    flex: 1,
  },
  clearBtn: {
    padding: 0,
    minWidth: 0,
    height: 'auto' as any,
  },
  inputContainer: {
    flex: 1,
  },
  sendBtn: {
    width: Spacing['2xl'],
    height: Spacing['2xl'],
    padding: 0,
  },
});
