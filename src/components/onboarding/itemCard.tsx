import type { FC, ReactNode } from 'react';
import { Alert } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { Colors, Spacing } from '@/constants/theme';
import { BButton, BCard, BIcon, BText, BView } from '../ui';

export type ItemCardProps = {
  title: string;
  subtitle?: string;
  amount: number;
  secondaryAmount?: number;
  secondaryLabel?: string;
  onDelete?: () => void;
  extra?: ReactNode;
  confirmDelete?: boolean;
};

const { common } = OnboardingStrings;

const formatCurrency = (amount: number): string => {
  return `${common.currency} ${amount.toLocaleString('en-IN')}`;
};

const BItemCard: FC<ItemCardProps> = ({
  title,
  subtitle,
  amount,
  secondaryAmount,
  secondaryLabel,
  onDelete,
  extra,
  confirmDelete = true,
}) => {
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
      <BView flex gap="sm">
        <BView row justify="space-between" align="flex-start">
          <BView flex marginX="sm">
            <BText variant="label" numberOfLines={1}>
              {title}
            </BText>
            {subtitle && (
              <BText variant="caption" muted style={{ marginTop: Spacing.xs }}>
                {subtitle}
              </BText>
            )}
          </BView>
          {onDelete && (
            <BButton variant="ghost" onPress={handleDelete} padding="xs" rounded="sm">
              <BIcon name="trash-outline" size="sm" color={Colors.light.error} />
            </BButton>
          )}
        </BView>

        <BView row align="center" justify="space-between" style={{ flexWrap: 'wrap' }}>
          <BText variant="subheading">{formatCurrency(amount)}</BText>
          {secondaryAmount !== undefined && secondaryLabel && (
            <BView row center>
              <BText variant="caption" muted>
                {secondaryLabel}:{' '}
              </BText>
              <BText variant="caption" color={Colors.light.primary}>
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
