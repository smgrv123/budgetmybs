import { BUDGET_OVERVIEW_ITEMS, createFinancialDataItems } from '@/src/constants/settings.config';
import { Spacing } from '@/src/constants/theme';
import { BudgetOverviewRow, FinancialDataRow, SettingsHeader, ThemeSelector } from '@/src/components/settings';
import { BButton, BCard, BIcon, BSafeAreaView, BText, BView } from '@/src/components/ui';
import { useDebts, useFixedExpenses, useProfile, useSavingsGoals } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BudgetValueKey, FinancialDataKey } from '@/src/types/settings';
import { calculateEMI } from '@/src/utils/budget';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { profile } = useProfile();
  const { fixedExpenses } = useFixedExpenses();
  const { debts } = useDebts();
  const { savingsGoals } = useSavingsGoals();

  // Calculate counts for financial data sections
  const counts = {
    [FinancialDataKey.FIXED_EXPENSES]: fixedExpenses?.length ?? 0,
    [FinancialDataKey.DEBTS]: debts?.length ?? 0,
    [FinancialDataKey.SAVINGS]: savingsGoals?.length ?? 0,
  };

  // Create financial data items with theme colors
  const financialDataItems = createFinancialDataItems(themeColors);

  // Calculate values for budget overview
  const totalFixedExpenses = fixedExpenses?.reduce((sum: number, item) => sum + item.amount, 0) ?? 0;
  const totalDebtPayments =
    debts?.reduce((sum: number, debt) => {
      const emi = calculateEMI(debt.principal, debt.interestRate, debt.tenureMonths);
      return sum + emi;
    }, 0) ?? 0;

  const values = {
    [BudgetValueKey.SALARY]: profile?.salary ?? 0,
    [BudgetValueKey.FIXED_EXPENSES]: totalFixedExpenses,
    [BudgetValueKey.DEBT_PAYMENTS]: totalDebtPayments,
  };

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <SettingsHeader title="Settings" />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg }}>
        {/* Profile Section */}
        <BCard variant="elevated">
          <BView gap="md">
            <BView row align="center" gap="md">
              <BView center rounded="full" bg={themeColors.primary} style={{ width: 60, height: 60 }}>
                <BText variant="heading" color={themeColors.white}>
                  {profile?.name.charAt(0).toUpperCase() ?? 'U'}
                </BText>
              </BView>
              <BView flex>
                <BText variant="subheading">{profile?.name ?? 'User'}</BText>
                <BText variant="body" muted>
                  ₹{profile?.salary.toLocaleString('en-IN') ?? 0}/month
                </BText>
              </BView>
            </BView>

            <BButton variant="outline" onPress={() => router.push('/dashboard/settings/edit-profile')} paddingY="sm">
              <BView row align="center" justify="center" gap="xs">
                <BIcon name="create-outline" size="sm" color={themeColors.primary} />
                <BText variant="label" color={themeColors.primary}>
                  Edit Profile
                </BText>
              </BView>
            </BButton>
          </BView>
        </BCard>

        {/* Appearance Section */}
        <BView gap="sm">
          <BText variant="subheading">Appearance</BText>
          <BCard variant="elevated">
            <ThemeSelector />
          </BCard>
        </BView>

        {/* Financial Data Section */}
        <BView gap="sm">
          <BText variant="subheading">Financial Data</BText>
          <BCard variant="elevated">
            {financialDataItems.map(({ key, ...item }) => (
              <FinancialDataRow key={key} {...item} count={counts[key]} />
            ))}
          </BCard>
        </BView>

        {/* Budget Overview Section */}
        <BView gap="sm">
          <BText variant="subheading">Budget Overview</BText>
          <BCard variant="elevated">
            {BUDGET_OVERVIEW_ITEMS.map(({ key, ...item }) => (
              <BudgetOverviewRow key={key} {...item} value={values[item.valueKey]} />
            ))}
          </BCard>
        </BView>
      </ScrollView>
    </BSafeAreaView>
  );
}
