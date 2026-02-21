import type { BorderRadiusType, SpacingValueType } from '@/src/constants/theme';
import { BorderRadius, Spacing } from '@/src/constants/theme';
import type { ThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FC } from 'react';
import type { FlexStyle, ViewProps as RNViewProps } from 'react-native';
import { View as RNView, StyleSheet } from 'react-native';

export interface BViewProps extends RNViewProps {
  /** Center children horizontally and vertically */
  center?: boolean;
  /** Flex row direction */
  row?: boolean;
  /** Apply flex: 1 */
  flex?: boolean;
  /** Justify content */
  justify?: FlexStyle['justifyContent'];
  /** Align items */
  align?: FlexStyle['alignItems'];
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
  /** Border (true for default, or color string) */
  border?: boolean | string;
  /** Border radius */
  rounded?: BorderRadiusType;
  fullWidth?: boolean;
}

const getSpacing = (value?: SpacingValueType): number | undefined => {
  if (!value) return undefined;
  return Spacing[value];
};

const getBackgroundColor = (bg: BViewProps['bg'], themeColors: ThemeColors): string | undefined => {
  if (!bg) return undefined;
  if (bg === 'transparent') return 'transparent';

  if (bg === 'background') return themeColors.background;
  if (bg === 'backgroundSecondary') return themeColors.backgroundSecondary;
  return bg;
};

const BView: FC<BViewProps> = ({
  center = false,
  row = false,
  flex = false,
  justify,
  align,
  padding,
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  gap,
  bg,
  border,
  rounded,
  style,
  children,
  fullWidth = false,
  ...props
}) => {
  const themeColors = useThemeColors();

  return (
    <RNView
      {...props}
      style={[
        center && styles.center,
        row && styles.row,
        flex && styles.flex,
        {
          ...(padding && { padding: getSpacing(padding) }),
          ...(paddingX && { paddingHorizontal: getSpacing(paddingX) }),
          ...(paddingY && { paddingVertical: getSpacing(paddingY) }),
          ...(margin && { margin: getSpacing(margin) }),
          ...(marginX && { marginHorizontal: getSpacing(marginX) }),
          ...(marginY && { marginVertical: getSpacing(marginY) }),
          ...(gap && { gap: getSpacing(gap) }),
          ...(bg && { backgroundColor: getBackgroundColor(bg, themeColors) }),
          ...(justify && { justifyContent: justify }),
          ...(align && { alignItems: align }),
          ...(typeof border === 'string' && { borderColor: border, borderWidth: 1 }),
          ...(border === true && { borderColor: themeColors.border, borderWidth: 1 }),
          ...(rounded && { borderRadius: BorderRadius[rounded] }),
          ...(fullWidth && { width: '100%' }),
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
