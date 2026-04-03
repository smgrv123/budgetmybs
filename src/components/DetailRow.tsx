import type { FC, ReactNode } from 'react';

import type { BIconProps } from '@/src/components/ui';
import { BIcon, BText, BView } from '@/src/components/ui';
import { Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

interface DetailRowProps {
  icon: BIconProps['name'];
  label: string;
  children: ReactNode;
}

const DetailRow: FC<DetailRowProps> = ({ icon, label, children }) => {
  const themeColors = useThemeColors();

  return (
    <BView row align="flex-start" gap={SpacingValue.MD}>
      <BIcon name={icon} size="sm" color={themeColors.textMuted} style={{ marginTop: Spacing.xxs }} />
      <BView flex>
        <BText variant={TextVariant.CAPTION} muted>
          {label}
        </BText>
        {children}
      </BView>
    </BView>
  );
};

export default DetailRow;
