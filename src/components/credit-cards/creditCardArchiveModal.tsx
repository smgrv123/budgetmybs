import type { FC } from 'react';

import { BButton, BModal, BText, BView } from '@/src/components/ui';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

const { archiveModal: STRINGS } = CREDIT_CARDS_SETTINGS_STRINGS;

export interface CreditCardArchiveModalProps {
  isVisible: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDeleteAnyway: () => void;
  cardNickname: string;
  txnCount: number;
  isLoading?: boolean;
}

const CreditCardArchiveModal: FC<CreditCardArchiveModalProps> = ({
  isVisible,
  onClose,
  onArchive,
  onDeleteAnyway,
  txnCount,
  isLoading = false,
}) => {
  const themeColors = useThemeColors();

  return (
    <BModal isVisible={isVisible} onClose={onClose} title={STRINGS.title}>
      <BView gap={SpacingValue.LG}>
        <BText variant={TextVariant.BODY} muted>
          {STRINGS.body(txnCount)}
        </BText>

        <BView gap={SpacingValue.SM}>
          <BButton variant={ButtonVariant.PRIMARY} onPress={onArchive} disabled={isLoading}>
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {STRINGS.archiveButton}
            </BText>
          </BButton>

          <BButton variant={ButtonVariant.GHOST} onPress={onDeleteAnyway} disabled={isLoading}>
            <BText variant={TextVariant.LABEL} style={{ color: themeColors.error }}>
              {STRINGS.deleteAnywayButton}
            </BText>
          </BButton>
        </BView>
      </BView>
    </BModal>
  );
};

export default CreditCardArchiveModal;
