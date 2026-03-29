import type { FC } from 'react';

import { BButton, BCard, BIcon, BIconProps, BText, BView } from '@/src/components/ui';
import { DASHBOARD_QUICK_ACTIONS_STRINGS } from '@/src/constants/dashboard.strings';
import {
  BorderRadius,
  ButtonVariant,
  IconSize,
  Opacity,
  Shadows,
  Spacing,
  SpacingValue,
  TextVariant,
} from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';

interface QuickActionTileProps {
  label: string;
  icon: BIconProps['name'];
  iconColor: string;
  iconBgColor: string;
  shadowColor: string;
  onPress: () => void;
  disabled?: boolean;
}

const QuickActionTile: FC<QuickActionTileProps> = ({
  label,
  icon,
  iconColor,
  iconBgColor,
  shadowColor,
  onPress,
  disabled,
}) => (
  <BButton
    variant={ButtonVariant.GHOST}
    onPress={onPress}
    disabled={disabled}
    style={{
      flex: 1,
      opacity: disabled ? Opacity.disabled : Opacity.full,
      ...Shadows.md,
      shadowColor,
    }}
  >
    <BCard
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 0.9,
      }}
    >
      <BView
        center
        style={{
          width: IconSize['2xl'],
          height: IconSize['2xl'],
          borderRadius: BorderRadius.lg,
          backgroundColor: iconBgColor,
          marginBottom: Spacing.sm,
        }}
      >
        <BIcon name={icon} color={iconColor} size="md" />
      </BView>
      <BText variant={TextVariant.CAPTION} center>
        {label}
      </BText>
    </BCard>
  </BButton>
);

interface QuickActionsSectionProps {
  onLogTransactionPress: () => void;
  onLogIncomePress: () => void;
  onManageSavingsPress: () => void;
}

const QuickActionsSection: FC<QuickActionsSectionProps> = ({
  onLogTransactionPress,
  onLogIncomePress,
  onManageSavingsPress,
}) => {
  const themeColors = useThemeColors();

  const tiles = [
    {
      key: 'log-transaction',
      label: DASHBOARD_QUICK_ACTIONS_STRINGS.logTransaction.label,
      icon: DASHBOARD_QUICK_ACTIONS_STRINGS.logTransaction.icon,
      iconColor: themeColors.primary,
      iconBgColor: themeColors.primaryFaded,
      shadowColor: themeColors.text,
      onPress: onLogTransactionPress,
    },
    {
      key: 'log-income',
      label: DASHBOARD_QUICK_ACTIONS_STRINGS.logIncome.label,
      icon: DASHBOARD_QUICK_ACTIONS_STRINGS.logIncome.icon,
      iconColor: themeColors.success,
      iconBgColor: themeColors.successBackground,
      shadowColor: themeColors.text,
      onPress: onLogIncomePress,
    },
    {
      key: 'manage-savings',
      label: DASHBOARD_QUICK_ACTIONS_STRINGS.manageSavings.label,
      icon: DASHBOARD_QUICK_ACTIONS_STRINGS.manageSavings.icon,
      iconColor: themeColors.confirmationGradientStart,
      iconBgColor: themeColors.summaryBg,
      shadowColor: themeColors.text,
      onPress: onManageSavingsPress,
    },
  ];

  return (
    <BView paddingX={SpacingValue.LG} marginY={SpacingValue.SM}>
      <BText variant={TextVariant.SUBHEADING} style={{ marginBottom: Spacing.md }}>
        {DASHBOARD_QUICK_ACTIONS_STRINGS.sectionTitle}
      </BText>
      <BView row gap={SpacingValue.MD} style={{ alignItems: 'stretch' }}>
        {tiles.map(({ key, ...tileProps }) => (
          <QuickActionTile key={key} {...tileProps} />
        ))}
      </BView>
    </BView>
  );
};

export default QuickActionsSection;
