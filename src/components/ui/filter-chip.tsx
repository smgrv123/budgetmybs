import { default as BButton } from './button';
import BIcon from './icon';
import type { BIconProps } from './icon';
import { default as BText } from './text';
import { default as BView } from './view';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import type { FC } from 'react';

export type FilterChipProps = {
  label: string;
  icon?: BIconProps['name'];
  onRemove: () => void;
};

const FilterChip: FC<FilterChipProps> = ({ label, icon, onRemove }) => {
  const themeColors = useThemeColors();

  return (
    <BView
      row
      align="center"
      gap={SpacingValue.XS}
      paddingX={SpacingValue.SM}
      paddingY={SpacingValue.XS}
      rounded="full"
      style={{
        backgroundColor: themeColors.primaryFaded,
        borderWidth: 1,
        borderColor: themeColors.primary,
      }}
    >
      {icon && <BIcon name={icon} size="sm" color={themeColors.primary} />}
      <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
        {label}
      </BText>
      <BButton variant={ButtonVariant.GHOST} onPress={onRemove} padding={SpacingValue.NONE}>
        <BIcon name="close-circle" size="sm" color={themeColors.primary} />
      </BButton>
    </BView>
  );
};

export default FilterChip;
