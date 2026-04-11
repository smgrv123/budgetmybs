/**
 * SplitwiseConnectionCard
 *
 * Shows the Splitwise connection state in Settings → Integrations.
 *  - Disconnected: "Connect Splitwise" button
 *  - Connecting:   loading state
 *  - Connected:    account name + avatar initial + "Disconnect" button
 *  - Reconnect:    warning banner + "Reconnect" button
 */

import type { FC } from 'react';

import { SPLITWISE_STRINGS } from '@/src/constants/splitwise.strings';
import { ButtonVariant, CardVariant, IconSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useSplitwise } from '@/src/hooks/useSplitwise';
import { SplitwiseConnectionStatus } from '@/src/types/splitwise';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BButton, BCard, BIcon, BText, BView } from '@/src/components/ui';

const SplitwiseConnectionCard: FC = () => {
  const themeColors = useThemeColors();
  const { status, currentUser, isCurrentUserLoading, connect, disconnect, isConnecting, isDisconnecting } =
    useSplitwise();

  const isConnected = status === SplitwiseConnectionStatus.CONNECTED;
  const isReconnectRequired = status === SplitwiseConnectionStatus.RECONNECT_REQUIRED;

  const displayName = currentUser
    ? `${currentUser.first_name}${currentUser.last_name ? ` ${currentUser.last_name}` : ''}`
    : null;

  const avatarInitial = currentUser?.first_name.charAt(0).toUpperCase() ?? '?';

  return (
    <BCard variant={CardVariant.DEFAULT} gap={SpacingValue.MD}>
      {/* Header row */}
      <BView row align="center" gap={SpacingValue.SM}>
        <BIcon name="people-outline" size={IconSize.md} color={themeColors.primary} />
        <BView flex>
          <BText variant={TextVariant.SUBHEADING}>{SPLITWISE_STRINGS.cardTitle}</BText>
          <BText variant={TextVariant.CAPTION} muted>
            {SPLITWISE_STRINGS.cardDescription}
          </BText>
        </BView>
      </BView>

      {/* Reconnect required banner */}
      {isReconnectRequired && (
        <BView padding={SpacingValue.SM} rounded="base" style={{ backgroundColor: themeColors.warningBackground }}>
          <BView row align="center" gap={SpacingValue.XS}>
            <BIcon name="warning-outline" size={IconSize.sm} color={themeColors.warning} />
            <BText variant={TextVariant.CAPTION} color={themeColors.warning}>
              {SPLITWISE_STRINGS.reconnectRequired}
            </BText>
          </BView>
        </BView>
      )}

      {/* Connected state: user info */}
      {isConnected && !isCurrentUserLoading && displayName && (
        <BView row align="center" gap={SpacingValue.SM}>
          <BView center fullRounded bg={themeColors.primary} style={{ width: 36, height: 36 }}>
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {avatarInitial}
            </BText>
          </BView>
          <BView flex>
            <BText variant={TextVariant.BODY}>{displayName}</BText>
            <BText variant={TextVariant.CAPTION} color={themeColors.success}>
              {SPLITWISE_STRINGS.connectedLabel}
            </BText>
          </BView>
        </BView>
      )}

      {/* Action button */}
      {isConnected || isReconnectRequired ? (
        <BView row gap={SpacingValue.SM}>
          {isReconnectRequired && (
            <BButton
              variant={ButtonVariant.PRIMARY}
              loading={isConnecting}
              onPress={() => connect()}
              style={{ flex: 1 }}
            >
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {SPLITWISE_STRINGS.reconnectButton}
              </BText>
            </BButton>
          )}
          <BButton
            variant={ButtonVariant.DANGER}
            loading={isDisconnecting}
            onPress={() => disconnect()}
            style={{ flex: isReconnectRequired ? undefined : 1 }}
          >
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {SPLITWISE_STRINGS.disconnectButton}
            </BText>
          </BButton>
        </BView>
      ) : (
        <BButton variant={ButtonVariant.PRIMARY} loading={isConnecting} fullWidth onPress={() => connect()}>
          <BView row align="center" gap={SpacingValue.XS}>
            <BIcon name="link-outline" size={IconSize.sm} color={themeColors.white} />
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {isConnecting ? SPLITWISE_STRINGS.connectingLabel : SPLITWISE_STRINGS.connectButton}
            </BText>
          </BView>
        </BButton>
      )}
    </BCard>
  );
};

export default SplitwiseConnectionCard;
