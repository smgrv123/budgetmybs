import { BButton, BCard, BIcon, BText, BView } from '@/src/components/ui';
import { CHAT_STRINGS } from '@/src/constants/chat';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FC } from 'react';

interface InlineDeleteConfirmProps {
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const InlineDeleteConfirm: FC<InlineDeleteConfirmProps> = ({
  entityName,
  entityType,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const themeColors = useThemeColors();

  return (
    <BCard gap={SpacingValue.SM} style={{ borderColor: themeColors.danger, margin: 0 }}>
      {/* Header */}
      <BView row align="center" gap={SpacingValue.XS}>
        <BIcon name="warning-outline" size={20} color={themeColors.danger} />
        <BText variant={TextVariant.LABEL} color={themeColors.danger} style={{ fontWeight: '600' }}>
          Delete {entityType}?
        </BText>
      </BView>

      {/* Message */}
      <BText variant={TextVariant.BODY} muted>
        {CHAT_STRINGS.DELETE_CONFIRM_PREFIX}{' '}
        <BText variant={TextVariant.BODY} color={themeColors.text}>
          {entityName}
        </BText>
        {CHAT_STRINGS.DELETE_CONFIRM_SUFFIX}
      </BText>

      {/* Actions */}
      <BView row gap={SpacingValue.SM}>
        <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} disabled={isDeleting} fullWidth>
          <BText variant={TextVariant.LABEL}>{CHAT_STRINGS.FORM_CANCEL}</BText>
        </BButton>

        <BButton variant={ButtonVariant.DANGER} onPress={onConfirm} loading={isDeleting} fullWidth>
          <BText variant={TextVariant.LABEL} color="#fff">
            {CHAT_STRINGS.DELETE_BUTTON}
          </BText>
        </BButton>
      </BView>
    </BCard>
  );
};

export default InlineDeleteConfirm;
