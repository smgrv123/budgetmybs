import type { FC, ReactNode } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { OnboardingStrings } from '@/constants/onboarding.strings';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { BButton, BIcon, BText, BView } from '../ui';

export interface ItemCardProps {
  title: string;
  subtitle?: string;
  amount: number;
  secondaryAmount?: number;
  secondaryLabel?: string;
  onDelete?: () => void;
  extra?: ReactNode;
  confirmDelete?: boolean;
}

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
    <BView padding="base" style={styles.container} bg={Colors.light.card}>
      <BView flex>
        <BView row style={styles.header}>
          <BView flex marginX="sm">
            <BText variant="label" numberOfLines={1}>
              {title}
            </BText>
            {subtitle && (
              <BText variant="caption" muted style={styles.subtitleMargin}>
                {subtitle}
              </BText>
            )}
          </BView>
          {onDelete && (
            <BButton variant="ghost" onPress={handleDelete} style={styles.deleteButton}>
              <BIcon name="trash-outline" size="sm" color={Colors.light.error} />
            </BButton>
          )}
        </BView>

        <BView row style={styles.amountRow}>
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
    </BView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  subtitleMargin: {
    marginTop: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  amountRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
});

export default BItemCard;
