import { DEBT_PAYOFF_STRATEGY_INFO } from '@/constants/onboarding.config';
import { ButtonVariant, Colors, SpacingValue, TextVariant } from '@/constants/theme';
import type { DebtPayoffPreference } from '@/db/types';
import { BButton, BModal, BText, BView } from '@/src/components/ui';

type DebtPayoffStrategyModalProps = {
  isVisible: boolean;
  onClose: () => void;
  strategy: DebtPayoffPreference | null;
};

export default function DebtPayoffStrategyModal({ isVisible, onClose, strategy }: DebtPayoffStrategyModalProps) {
  if (!strategy) return null;

  const info = DEBT_PAYOFF_STRATEGY_INFO[strategy];

  return (
    <BModal isVisible={isVisible} onClose={onClose} title={info.title}>
      <BView gap={SpacingValue.LG}>
        <BText>{info.description}</BText>

        <BView
          padding={SpacingValue.SM}
          style={{
            backgroundColor: Colors.light.successBackground,
            borderWidth: 1,
            borderColor: Colors.light.success,
            borderRadius: 8,
          }}
        >
          <BText variant={TextVariant.CAPTION} color={Colors.light.success}>
            ✓ {info.benefit}
          </BText>
        </BView>

        <BView
          padding={SpacingValue.SM}
          style={{
            backgroundColor: Colors.light.background,
            borderRadius: 8,
          }}
        >
          <BText variant={TextVariant.CAPTION} muted>
            Example: {info.example}
          </BText>
        </BView>

        <BButton variant={ButtonVariant.PRIMARY} onPress={onClose} rounded="lg" paddingY={SpacingValue.MD}>
          <BText variant={TextVariant.LABEL} color={Colors.light.white}>
            Got it
          </BText>
        </BButton>
      </BView>
    </BModal>
  );
}
