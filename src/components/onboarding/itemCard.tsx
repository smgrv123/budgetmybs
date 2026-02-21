import type { FC, ReactNode } from 'react';
import { Alert } from 'react-native';

import { OnboardingStrings } from '@/src/constants/onboarding.strings';
import { ButtonVariant, IconFamily, IconSize, Spacing, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';
import { BButton, BCard, BIcon, BText, BView } from '../ui';

export type ItemCardProps = {
  title: string;
  subtitle?: string;
  amount: number;
  secondaryAmount?: number;
  secondaryLabel?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  extra?: ReactNode;
  confirmDelete?: boolean;
};

const { common } = OnboardingStrings;

const BItemCard: FC<ItemCardProps> = ({
  title,
  subtitle,
  amount,
  secondaryAmount,
  secondaryLabel,
  onDelete,
  onEdit,
  isEditing = false,
  extra,
  confirmDelete = true,
}) => {
  const themeColors = useThemeColors();

  const handleDelete = () => {
    if (confirmDelete && onDelete) {
      Alert.alert(
        'Delete Item',
        common.deleteConfirm,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ],
        { cancelable: true }
      );
    } else {
      onDelete?.();
    }
  };

  return (
    <BCard style={{ marginBottom: Spacing.md }}>
      <BView flex gap={SpacingValue.SM}>
        <BView row justify="space-between" align="flex-start">
          <BView flex>
            <BText variant={TextVariant.SUBHEADING} numberOfLines={1}>
              {title}
            </BText>
            {subtitle && (
              <BText variant={TextVariant.CAPTION} muted style={{ marginTop: Spacing.xs }}>
                {subtitle}
              </BText>
            )}
          </BView>
          {!isEditing && (
            <BView row gap="xs">
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
            </BView>
          )}
        </BView>

        <BView row align="center" justify="space-between" style={{ flexWrap: 'wrap' }}>
          <BText variant={TextVariant.LABEL}>{formatCurrency(amount)}</BText>
          {secondaryAmount !== undefined && secondaryLabel && (
            <BView row center>
              <BText variant={TextVariant.CAPTION} muted>
                {secondaryLabel}:{' '}
              </BText>
              <BText variant={TextVariant.CAPTION} color={themeColors.primary}>
                {formatCurrency(secondaryAmount)}
              </BText>
            </BView>
          )}
        </BView>

        {extra}
      </BView>
    </BCard>
  );
};

export default BItemCard;
