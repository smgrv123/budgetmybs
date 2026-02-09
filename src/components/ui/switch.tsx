import type { FC } from 'react';
import type { SwitchProps } from 'react-native';
import { Switch } from 'react-native';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-color-scheme';
import { ColorScheme } from '@/src/types';

export interface BSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  useThemeColors?: boolean;
}

const BSwitch: FC<BSwitchProps> = ({ useThemeColors = true, ...props }) => {
  const { colorScheme } = useTheme();
  const resolvedColorScheme = colorScheme ?? ColorScheme.LIGHT;
  const themeColors = Colors[resolvedColorScheme];

  if (!useThemeColors) {
    return <Switch {...props} />;
  }

  return (
    <Switch
      trackColor={{
        false: themeColors.muted,
        true: themeColors.primary,
      }}
      thumbColor={props.value ? themeColors.white : themeColors.backgroundSecondary}
      ios_backgroundColor={themeColors.muted}
      {...props}
    />
  );
};

export default BSwitch;
