import { Colors, IconFamily, IconSize } from '@/constants/theme';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { IconProps } from '@expo/vector-icons/build/createIconSet';
import type { FC } from 'react';

type IconSizeKey = keyof typeof IconSize;

// Glyph names for each family
type IoniconGlyph = React.ComponentProps<typeof Ionicons>['name'];
type MaterialGlyph = React.ComponentProps<typeof MaterialIcons>['name'];
type FeatherGlyph = React.ComponentProps<typeof Feather>['name'];
type FontAwesomeGlyph = React.ComponentProps<typeof FontAwesome>['name'];
type AllGlyphs = IoniconGlyph | MaterialGlyph | FeatherGlyph | FontAwesomeGlyph;

// Extend IconProps, override size to accept theme keys
export interface BIconProps extends Omit<IconProps<AllGlyphs>, 'size'> {
  /** Icon family */
  family?: (typeof IconFamily)[keyof typeof IconFamily];
  /** Icon size - theme key or number */
  size?: IconSizeKey | number;
}

const BIcon: FC<BIconProps> = ({
  family = IconFamily.IONICONS,
  name,
  size = 'base',
  color = Colors.light.icon,
  ...props
}) => {
  const iconSize = typeof size === 'number' ? size : IconSize[size];

  const commonProps = { name, size: iconSize, color, ...props };

  switch (family) {
    case IconFamily.MATERIAL:
      return <MaterialIcons {...commonProps} name={name as MaterialGlyph} />;
    case IconFamily.FEATHER:
      return <Feather {...commonProps} name={name as FeatherGlyph} />;
    case IconFamily.FONTAWESOME:
      return <FontAwesome {...commonProps} name={name as FontAwesomeGlyph} />;
    default:
      return <Ionicons {...commonProps} name={name as IoniconGlyph} />;
  }
};

export default BIcon;
