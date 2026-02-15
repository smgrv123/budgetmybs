import type { FC } from 'react';
import type { SwitchProps } from 'react-native';
import { Switch } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-color';

export interface BSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  useThemeColors?: boolean;
}

const BSwitch: FC<BSwitchProps> = ({ useThemeColors: useThemeColorsProp = true, ...props }) => {
  const themeColors = useThemeColors();

  if (!useThemeColorsProp) {
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
