import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/hooks/use-theme-color';
import { useThemeColors } from '@/hooks/use-theme-color';

export interface BSafeAreaViewProps {
  /** Children to render */
  children: ReactNode;
  /** Background color */
  bg?: 'background' | 'backgroundSecondary' | 'transparent';
  /** Edges to apply safe area insets */
  edges?: Edge[];
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

const getBackgroundColor = (bg: BSafeAreaViewProps['bg'], themeColors: ThemeColors): string => {
  if (!bg || bg === 'background') return themeColors.background;
  if (bg === 'backgroundSecondary') return themeColors.backgroundSecondary;
  return 'transparent';
};

const BSafeAreaView: FC<BSafeAreaViewProps> = ({ children, bg = 'background', edges = ['top', 'bottom'], style }) => {
  const themeColors = useThemeColors();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: getBackgroundColor(bg, themeColors) }, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BSafeAreaView;
