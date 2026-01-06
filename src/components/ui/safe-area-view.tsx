import type { FC, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

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

const getBackgroundColor = (bg?: BSafeAreaViewProps['bg']): string => {
  if (!bg || bg === 'background') return Colors.light.background;
  if (bg === 'backgroundSecondary') return Colors.light.backgroundSecondary;
  return 'transparent';
};

const BSafeAreaView: FC<BSafeAreaViewProps> = ({ children, bg = 'background', edges = ['top', 'bottom'], style }) => {
  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: getBackgroundColor(bg) }, style]}>
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
