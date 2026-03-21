import { LinearGradient } from 'expo-linear-gradient';
import type { FC } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { BButton, BIcon, BText, BView, type BIconProps } from '@/src/components/ui';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import type { IconFamilyType } from '@/src/constants/theme';
import { BorderRadius, ButtonVariant, IconFamily, IconSize, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

export type CreditCardPreviewCardProps = {
  nickname?: string;
  bank?: string;
  providerLabel?: string;
  providerIcon?: {
    name: BIconProps['name'];
    family?: IconFamilyType;
  };
  last4?: string;
  usedAmount?: number;
  creditLimit?: number;
  dueDateLabel?: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  onUnarchive?: () => void;
  isEditing?: boolean;
  isArchived?: boolean;
  confirmDelete?: boolean;
};

const CreditCardPreviewCard: FC<CreditCardPreviewCardProps> = ({
  nickname,
  bank,
  providerLabel,
  providerIcon,
  last4,
  usedAmount,
  creditLimit,
  dueDateLabel,
  onDelete,
  onEdit,
  onUnarchive,
  isEditing,
  isArchived = false,
  confirmDelete = true,
}) => {
  const themeColors = useThemeColors();

  const gradientColors: [string, string, string] = [
    themeColors.confirmationGradientStart,
    themeColors.confirmationGradientMiddle,
    themeColors.confirmationGradientEnd,
  ];

  const displayNickname = nickname || CREDIT_CARDS_SETTINGS_STRINGS.preview.nicknameFallback;
  const displayBank = bank || CREDIT_CARDS_SETTINGS_STRINGS.preview.bankFallback;
  const displayProvider = providerLabel || CREDIT_CARDS_SETTINGS_STRINGS.preview.providerFallback;
  const displayLast4 = last4 || CREDIT_CARDS_SETTINGS_STRINGS.preview.last4Fallback;
  const displayDue = dueDateLabel || CREDIT_CARDS_SETTINGS_STRINGS.preview.dueFallback;

  const showLimit = typeof creditLimit === 'number' && creditLimit > 0;
  const usedValue = typeof usedAmount === 'number' ? usedAmount : 0;
  const utilizationPercent = showLimit && creditLimit ? Math.round((usedValue / creditLimit) * 100) : 0;

  const handleDelete = () => {
    if (confirmDelete && onDelete) {
      Alert.alert(
        CREDIT_CARDS_SETTINGS_STRINGS.alerts.deleteTitle,
        CREDIT_CARDS_SETTINGS_STRINGS.alerts.deleteBody,
        [
          { text: CREDIT_CARDS_SETTINGS_STRINGS.alerts.deleteCancel, style: 'cancel' },
          { text: CREDIT_CARDS_SETTINGS_STRINGS.alerts.deleteConfirm, style: 'destructive', onPress: onDelete },
        ],
        { cancelable: true }
      );
    } else {
      onDelete?.();
    }
  };
  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <BView padding={SpacingValue.LG} gap={SpacingValue.MD}>
        <BView row justify="space-between" align="center">
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {displayBank}
          </BText>
          <BView row align="center" gap={SpacingValue.XS}>
            {providerIcon ? (
              <BIcon
                name={providerIcon.name}
                family={providerIcon.family}
                size={IconSize.lg}
                color={themeColors.white}
              />
            ) : (
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {displayProvider}
              </BText>
            )}
            {isArchived && (
              <BView
                padding={SpacingValue.XS}
                rounded={SpacingValue.SM}
                style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
              >
                <BText variant={TextVariant.CAPTION} color={themeColors.white}>
                  {CREDIT_CARDS_SETTINGS_STRINGS.archivedSection.title}
                </BText>
              </BView>
            )}
            {!isEditing && !isArchived && (
              <>
                {onEdit && (
                  <BButton
                    variant={ButtonVariant.GHOST}
                    onPress={onEdit}
                    padding={SpacingValue.XS}
                    rounded={SpacingValue.SM}
                  >
                    <BIcon family={IconFamily.FEATHER} name="edit-2" size={IconSize.sm} color={themeColors.primary} />
                  </BButton>
                )}
                {onDelete && (
                  <BButton
                    variant={ButtonVariant.GHOST}
                    onPress={handleDelete}
                    padding={SpacingValue.XS}
                    rounded={SpacingValue.SM}
                  >
                    <BIcon name="trash-outline" size={IconSize.sm} color={themeColors.error} />
                  </BButton>
                )}
              </>
            )}
            {!isEditing && isArchived && onUnarchive && (
              <BButton
                variant={ButtonVariant.GHOST}
                onPress={onUnarchive}
                padding={SpacingValue.XS}
                rounded={SpacingValue.SM}
              >
                <BIcon name="refresh-outline" size={IconSize.sm} color={themeColors.white} />
              </BButton>
            )}
          </BView>
        </BView>

        <BView gap={SpacingValue.XXS}>
          <BText variant={TextVariant.CAPTION} color={themeColors.white}>
            {displayNickname}
          </BText>
          <BText variant={TextVariant.SUBHEADING} color={themeColors.white}>
            {CREDIT_CARDS_SETTINGS_STRINGS.preview.mask} {displayLast4}
          </BText>
        </BView>

        <BView row justify="space-between" align="flex-end">
          <BView>
            <BText variant={TextVariant.CAPTION} color={themeColors.white}>
              {CREDIT_CARDS_SETTINGS_STRINGS.dueLabel}
            </BText>
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {displayDue}
            </BText>
          </BView>

          {showLimit && (
            <BView align="flex-end">
              <BText variant={TextVariant.CAPTION} color={themeColors.white}>
                {CREDIT_CARDS_SETTINGS_STRINGS.limitLabel}
              </BText>
              <BText variant={TextVariant.LABEL} color={themeColors.white}>
                {formatCurrency(creditLimit)}
              </BText>
            </BView>
          )}
        </BView>

        {showLimit && (
          <BView gap={SpacingValue.XXS}>
            <BView row justify="space-between" align="center">
              <BText variant={TextVariant.CAPTION} color={themeColors.white}>
                {formatCurrency(usedValue)} {CREDIT_CARDS_SETTINGS_STRINGS.usedLabel}
              </BText>
              <BText variant={TextVariant.CAPTION} color={themeColors.white}>
                {CREDIT_CARDS_SETTINGS_STRINGS.ofLabel} {formatCurrency(creditLimit)}
              </BText>
            </BView>
            <BView row justify="flex-end">
              <BText variant={TextVariant.CAPTION} color={themeColors.white}>
                {utilizationPercent}% {CREDIT_CARDS_SETTINGS_STRINGS.utilizationLabel}
              </BText>
            </BView>
          </BView>
        )}
      </BView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius[SpacingValue.LG],
    overflow: 'hidden',
    width: '100%',
  },
});

export default CreditCardPreviewCard;
