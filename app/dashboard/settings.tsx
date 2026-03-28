import { ScrollView } from 'react-native';

import SettingsAppearanceSection from '@/src/components/settings/appearance';
import SettingsBudgetSection from '@/src/components/settings/budget';
import SettingsFinancialSection from '@/src/components/settings/financial';
import SettingsProfileSection from '@/src/components/settings/profile';
import { BSafeAreaView, BText, BView } from '@/src/components/ui';
import { createFinancialDataItems } from '@/src/constants/settings.config';
import { SETTINGS_SCREEN_STRINGS } from '@/src/constants/settings.strings';
import { Spacing } from '@/src/constants/theme';
import {
  useCreditCards,
  useDebts,
  useFixedExpenses,
  useIncome,
  useMonthlyBudget,
  useProfile,
  useSavingsGoals,
} from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { BudgetValueKey, FinancialDataKey } from '@/src/types/settings';
import { calculateEMI } from '@/src/utils/budget';

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const { profile } = useProfile();
  const { additionalIncome } = useMonthlyBudget();
  const { income } = useIncome();

  const { fixedExpenses } = useFixedExpenses();
  const { debts } = useDebts();
  const { savingsGoals } = useSavingsGoals();
  const { creditCards } = useCreditCards();

  // Calculate counts for financial data sections
  const counts = {
    [FinancialDataKey.FIXED_EXPENSES]: fixedExpenses?.length ?? 0,
    [FinancialDataKey.DEBTS]: debts?.length ?? 0,
    [FinancialDataKey.SAVINGS]: savingsGoals?.length ?? 0,
    [FinancialDataKey.CREDIT_CARDS]: creditCards?.length ?? 0,
    [FinancialDataKey.INCOME]: income?.length ?? 0,
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
    [BudgetValueKey.ADDITIONAL_INCOME]: additionalIncome ?? 0,
  };

  const settingsScreenSections = [
    {
      key: 'profile',
      component: <SettingsProfileSection profile={profile} />,
      rank: 0,
      enabled: true,
    },
    {
      key: 'appearance',
      component: <SettingsAppearanceSection />,
      rank: 1,
      enabled: true,
    },
    {
      key: 'financial',
      component: <SettingsFinancialSection financialDataItems={financialDataItems} counts={counts} />,
      rank: 2,
      enabled: true,
    },
    {
      key: 'budget',
      component: <SettingsBudgetSection values={values} />,
      rank: 3,
      enabled: true,
    },
  ];

  return (
    <BSafeAreaView edges={['top', 'left', 'right']}>
      <BView paddingX="base" paddingY="md">
        <BText variant="heading">{SETTINGS_SCREEN_STRINGS.title}</BText>
      </BView>

      <ScrollView contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg }}>
        {settingsScreenSections
          .filter((s) => s.enabled)
          .sort((a, b) => a.rank - b.rank)
          .map(({ key, component }) => (
            <BView key={key}>{component}</BView>
          ))}
      </ScrollView>
    </BSafeAreaView>
  );
}
