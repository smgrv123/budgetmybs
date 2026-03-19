import type { FC } from 'react';
import React from 'react';

import type { Profile } from '@/db';
import { SETTINGS_SCREEN_STRINGS } from '@/src/constants/settings.strings';
import { ButtonVariant, CardVariant, IconSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BCard, BIcon, BLink, BText, BView } from '../ui';

const SettingsProfileSection: FC<{ profile: Profile | undefined }> = ({ profile }) => {
  const themeColors = useThemeColors();

  return (
    <BCard variant={CardVariant.ELEVATED}>
      <BView gap={SpacingValue.MD}>
        <BView row align="center" gap={SpacingValue.MD}>
          <BView center fullRounded bg={themeColors.primary} style={{ width: 60, height: 60 }}>
            <BText variant={TextVariant.HEADING} color={themeColors.white}>
              {profile?.name.charAt(0).toUpperCase() ?? 'U'}
            </BText>
          </BView>
          <BView flex>
            <BText variant={TextVariant.SUBHEADING}>{profile?.name ?? SETTINGS_SCREEN_STRINGS.userFallback}</BText>
            <BText variant={TextVariant.BODY} muted>
              ₹{profile?.salary.toLocaleString('en-IN') ?? 0}
              {SETTINGS_SCREEN_STRINGS.perMonthSuffix}
            </BText>
          </BView>
        </BView>

        <BLink variant={ButtonVariant.OUTLINE} href="/settings/edit-profile">
          <BView row align="center" justify="center" gap={SpacingValue.XS}>
            <BIcon name="create-outline" size={IconSize.sm} color={themeColors.primary} />
            <BText variant={TextVariant.LABEL} color={themeColors.primary}>
              {SETTINGS_SCREEN_STRINGS.editProfileButton}
            </BText>
          </BView>
        </BLink>
      </BView>
    </BCard>
  );
};

export default SettingsProfileSection;
