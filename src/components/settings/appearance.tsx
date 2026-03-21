import React from 'react';

import { SETTINGS_SCREEN_STRINGS } from '@/src/constants/settings.strings';
import { CardVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { BCard, BText, BView } from '../ui';
import ThemeSelector from './themeSelector';

const SettingsAppearanceSection = () => {
  return (
    <BView gap={SpacingValue.MD}>
      <BText variant={TextVariant.SUBHEADING}>{SETTINGS_SCREEN_STRINGS.appearanceTitle}</BText>
      <BCard variant={CardVariant.ELEVATED}>
        <ThemeSelector />
      </BCard>
    </BView>
  );
};

export default SettingsAppearanceSection;
