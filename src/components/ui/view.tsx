import type { SpacingValueType } from '@/constants/theme';
import { Colors, Spacing } from '@/constants/theme';
import type { FC } from 'react';
import type { ViewProps as RNViewProps } from 'react-native';
import { View as RNView, StyleSheet } from 'react-native';

export interface BViewProps extends RNViewProps {
  /** Center children horizontally and vertically */
  center?: boolean;
  /** Flex row direction */
  row?: boolean;
  /** Apply flex: 1 */
  flex?: boolean;
  /** Padding (all sides) */
  padding?: SpacingValueType;
  /** Padding horizontal */
  paddingX?: SpacingValueType;
  /** Padding vertical */
  paddingY?: SpacingValueType;
  /** Margin (all sides) */
  margin?: SpacingValueType;
  /** Margin horizontal */
  marginX?: SpacingValueType;
  /** Margin vertical */
  marginY?: SpacingValueType;
  /** Gap between children */
  gap?: SpacingValueType;
  /** Background color */
  bg?: 'background' | 'backgroundSecondary' | 'transparent' | string;
}

const getSpacing = (value?: SpacingValueType): number | undefined => {
  if (!value) return undefined;
  return Spacing[value];
};

const getBackgroundColor = (bg?: BViewProps['bg']): string | undefined => {
  if (!bg) return undefined;
  if (bg === 'transparent') return 'transparent';
  if (bg === 'background') return Colors.light.background;
  if (bg === 'backgroundSecondary') return Colors.light.backgroundSecondary;
  return bg;
};

const BView: FC<BViewProps> = ({
  center = false,
  row = false,
  flex = false,
  padding,
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  gap,
  bg,
  style,
  children,
  ...props
}) => {
  return (
    <RNView
      {...props}
      style={[
        center && styles.center,
        row && styles.row,
        flex && styles.flex,
        {
          padding: getSpacing(padding),
          paddingHorizontal: getSpacing(paddingX),
          paddingVertical: getSpacing(paddingY),
          margin: getSpacing(margin),
          marginHorizontal: getSpacing(marginX),
          marginVertical: getSpacing(marginY),
          gap: getSpacing(gap),
          backgroundColor: getBackgroundColor(bg),
        },
        style,
      ]}
    >
      {children}
    </RNView>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
});

export default BView;
