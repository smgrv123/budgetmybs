import type { FC } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { QuickStatType } from '@/constants/dashboardData';
import {
  BorderRadius,
  ButtonVariant,
  IconFamily,
  IconSize,
  Spacing,
  SpacingValue,
  TextVariant,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { BButton, BIcon, BModal, BText, BView } from '@/src/components/ui';
import type { QuickStatTypeValue } from '@/src/types/dashboard';

type FixedExpenseItem = {
  id: string;
  name: string;
  type: string;
  amount: number;
};

type DebtItem = {
  id: string;
  name: string;
  type: string;
  emi: number;
};

type SavingsGoalItem = {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  isCompleted: boolean;
};

export type QuickStatSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  type: QuickStatTypeValue;
  title: string;
  // Data for each type
  fixedExpenses?: FixedExpenseItem[];
  debts?: DebtItem[];
  savingsGoals?: SavingsGoalItem[];
  onMarkGoalComplete?: (goalId: string) => void;
};

// const EmptyState: FC<{ icon: string; message: string }> = ({ icon, message }) => (
//   <BView center paddingY={SpacingValue.XL}>
//     <BIcon name={icon as any} size="lg" color={Colors.light.textMuted} />
//     <BText variant={TextVariant.BODY} muted style={{ marginTop: Spacing.md }}>
//       {message}
//     </BText>
//   </BView>
// );

const QuickStatSheet: FC<QuickStatSheetProps> = ({
  isVisible,
  onClose,
  type,
  title,
  fixedExpenses = [],
  debts = [],
  savingsGoals = [],
  onMarkGoalComplete,
}) => {
  const themeColors = useThemeColors();

  const renderFixedExpense = ({ item }: { item: FixedExpenseItem }) => (
    <BView
      row
      justify="space-between"
      align="center"
      paddingY={SpacingValue.SM}
      style={[styles.listItem, { borderBottomColor: themeColors.border }]}
    >
      <BView flex>
        <BText variant={TextVariant.LABEL}>{item.name}</BText>
        <BText variant={TextVariant.CAPTION} muted>
          {item.type}
        </BText>
      </BView>
      <BText variant={TextVariant.LABEL}>₹{item.amount.toLocaleString('en-IN')}</BText>
    </BView>
  );

  const renderDebt = ({ item }: { item: DebtItem }) => (
    <BView
      row
      justify="space-between"
      align="center"
      paddingY={SpacingValue.SM}
      style={[styles.listItem, { borderBottomColor: themeColors.border }]}
    >
      <BView flex>
        <BText variant={TextVariant.LABEL}>{item.name}</BText>
        <BText variant={TextVariant.CAPTION} muted>
          {item.type}
        </BText>
      </BView>
      <BView align="flex-end">
        <BText variant={TextVariant.LABEL}>₹{item.emi.toLocaleString('en-IN')}</BText>
        <BText variant={TextVariant.CAPTION} muted>
          /month
        </BText>
      </BView>
    </BView>
  );

  const renderSavingsGoal = ({ item }: { item: SavingsGoalItem }) => {
    // Only show checkbox for incomplete goals when viewing incomplete sheet
    const showCheckbox = !item.isCompleted && type === QuickStatType.INCOMPLETE && onMarkGoalComplete;

    return (
      <BView
        row
        justify="space-between"
        align="center"
        paddingY={SpacingValue.SM}
        style={[styles.listItem, { borderBottomColor: themeColors.border }]}
      >
        <BView flex row align="center" gap={SpacingValue.SM}>
          {showCheckbox && (
            <BButton
              variant={ButtonVariant.GHOST}
              onPress={() => onMarkGoalComplete(item.id)}
              style={styles.checkbox}
              paddingX={SpacingValue.SM}
            >
              <BIcon name="checkbox-outline" size={IconSize.base} color={themeColors.textMuted} />
            </BButton>
          )}
          {item.isCompleted && (
            <BView center style={styles.completedBadge}>
              <BIcon name="check" family={IconFamily.FONTAWESOME} size="sm" color={themeColors.success} />
            </BView>
          )}
          <BView flex>
            <BText variant={TextVariant.LABEL} style={item.isCompleted ? styles.completedText : undefined}>
              {item.name}
            </BText>
            <BText variant={TextVariant.CAPTION} muted>
              {item.type}
            </BText>
          </BView>
        </BView>
        <BText variant={TextVariant.LABEL} style={item.isCompleted ? styles.completedText : undefined}>
          ₹{item.targetAmount.toLocaleString('en-IN')}
        </BText>
      </BView>
    );
  };

  const renderContent = () => {
    // Configuration for each sheet type
    const sheetConfig = {
      [QuickStatType.FIXED]: {
        data: fixedExpenses,
        renderItem: renderFixedExpense,
        emptyIcon: 'receipt-outline',
        emptyMessage: 'No fixed expenses yet',
        showHeader: false,
      },
      [QuickStatType.EMIS]: {
        data: debts,
        renderItem: renderDebt,
        emptyIcon: 'card-outline',
        emptyMessage: 'No debts/EMIs yet',
        showHeader: false,
      },
      [QuickStatType.COMPLETED]: {
        data: savingsGoals.filter((g) => g.isCompleted),
        renderItem: renderSavingsGoal,
        emptyIcon: 'checkmark-circle-outline',
        emptyMessage: 'No completed goals yet',
        showHeader: false,
      },
      [QuickStatType.INCOMPLETE]: {
        data: savingsGoals.filter((g) => !g.isCompleted),
        renderItem: renderSavingsGoal,
        emptyIcon: 'flag-outline',
        emptyMessage: 'No active goals yet',
        showHeader: false,
      },
      [QuickStatType.GOALS]: {
        data: savingsGoals,
        renderItem: renderSavingsGoal,
        emptyIcon: 'flag-outline',
        emptyMessage: 'No savings goals yet',
        showHeader: true,
      },
    };

    const config = sheetConfig[type as keyof typeof sheetConfig];
    if (!config) return null;

    // Show empty state if no data
    // if (config.data.length === 0) {
    //   return <EmptyState icon={config.emptyIcon} message={config.emptyMessage} />;
    // }

    // Render the list
    return (
      <FlatList
        data={config.data as unknown[]}
        keyExtractor={(item) => (item as { id: string }).id}
        renderItem={config.renderItem as any}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <BModal isVisible={isVisible} onClose={onClose} title={title} position="bottom" showCloseButton>
      {renderContent()}
    </BModal>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: Spacing.sm,
  },
  listItem: {
    borderBottomWidth: 1,
  },
  checkbox: {
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: IconSize.lg,
    height: IconSize.lg,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});

export default QuickStatSheet;
