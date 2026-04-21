/**
 * InfoBadge
 *
 * Shared read-only badge component used for contextual callouts (e.g. impulse, Splitwise).
 * Renders an icon on the left with a text stack on the right.
 */

import type { FC } from 'react';

import { BIcon, BText, BView } from '@/src/components/ui';
import type { BIconProps } from '@/src/components/ui';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

export type InfoBadgeProps = {
  /** Ionicons icon name */
  iconName: BIconProps['name'];
  /** Primary text */
  title: string;
  /** Optional secondary line */
  subtitle?: string | null;
  /** Drives color selection via useThemeColors */
  variant: 'warning' | 'primary';
};

const InfoBadge: FC<InfoBadgeProps> = ({ iconName, title, subtitle, variant }) => {
  const themeColors = useThemeColors();

  const textColor = variant === 'warning' ? themeColors.warning : themeColors.primary;
  const bgColor = variant === 'warning' ? themeColors.warningBackground : themeColors.primaryFaded;
  const borderColor = variant === 'warning' ? themeColors.warning : themeColors.primary;

  return (
    <BView
      row
      align="center"
      gap={SpacingValue.XS}
      paddingX={SpacingValue.SM}
      paddingY={SpacingValue.XS}
      rounded="base"
      style={{ borderWidth: 1, backgroundColor: bgColor, borderColor: borderColor }}
    >
      <BIcon name={iconName} size="sm" color={textColor} />
      <BView gap={SpacingValue.NONE}>
        <BText variant={TextVariant.CAPTION} color={textColor}>
          {title}
        </BText>
        {subtitle && (
          <BText variant={TextVariant.CAPTION} color={textColor}>
            {subtitle}
          </BText>
        )}
      </BView>
    </BView>
  );
};

export default InfoBadge;
