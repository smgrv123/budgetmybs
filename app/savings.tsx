import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import {
  BButton,
  BCard,
  BIcon,
  BSafeAreaView,
  BText,
  BToast,
  BView,
  SavingsDepositTab,
  SavingsOverviewTab,
} from '@/src/components';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import {
  BorderRadius,
  ButtonVariant,
  IconSize,
  Spacing,
  SpacingValue,
  TextVariant,
  ToastVariant,
} from '@/src/constants/theme';
import { useSavingsGoals } from '@/src/hooks';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { formatCurrency } from '@/src/utils/format';

const SavingsTab = {
  OVERVIEW: 'overview',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
} as const;
type SavingsTabType = (typeof SavingsTab)[keyof typeof SavingsTab];

const TAB_CONFIG: {
  key: SavingsTabType;
  label: string;
  activeIcon: string;
  activeIconColor: 'success' | 'error' | 'primary';
}[] = [
  {
    key: SavingsTab.OVERVIEW,
    label: SAVINGS_SCREEN_STRINGS.tabs.overview,
    activeIcon: 'wallet-outline',
    activeIconColor: 'primary',
  },
  {
    key: SavingsTab.DEPOSIT,
    label: SAVINGS_SCREEN_STRINGS.tabs.deposit,
    activeIcon: 'arrow-up-circle',
    activeIconColor: 'success',
  },
  {
    key: SavingsTab.WITHDRAW,
    label: SAVINGS_SCREEN_STRINGS.tabs.withdraw,
    activeIcon: 'arrow-down-circle',
    activeIconColor: 'error',
  },
];

export default function SavingsScreenRoute() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState<SavingsTabType>(SavingsTab.OVERVIEW);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleDepositSuccess = (message: string) => {
    setActiveTab(SavingsTab.OVERVIEW);
    setToastMessage(message);
    setToastVisible(true);
  };

  const { savingsGoals, savingsBalancesAllGoals, adHocSavingsBalances, monthlyDepositsByGoal } = useSavingsGoals();

  // Compute total all-time balance: sum of all goal net balances + all ad-hoc net balances
  const goalTotal = savingsBalancesAllGoals.reduce((sum, b) => sum + b.net, 0);
  const adHocTotal = adHocSavingsBalances.reduce((sum, b) => sum + b.net, 0);
  const totalSavings = goalTotal + adHocTotal;

  const HEADER_GRADIENT: [string, string, string] = [
    themeColors.confirmationGradientStart,
    themeColors.confirmationGradientMiddle,
    themeColors.confirmationGradientEnd,
  ];

  const activeTabColor = (colorKey: 'success' | 'error' | 'primary') => {
    if (colorKey === 'success') return themeColors.success;
    if (colorKey === 'error') return themeColors.error;
    return themeColors.primary;
  };

  return (
    <BSafeAreaView edges={[]}>
      {/* Gradient Header */}
      <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        {/* Back button */}
        <BButton
          variant={ButtonVariant.GHOST}
          onPress={() => router.back()}
          padding={SpacingValue.XS}
          style={styles.backButton}
        >
          <BIcon name="chevron-back" size="md" color={themeColors.white} />
        </BButton>

        {/* Wallet icon in rounded square */}
        <BView center style={[styles.walletIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <BIcon name="wallet-outline" size="lg" color={themeColors.white} />
        </BView>

        {/* Amount */}
        <BText variant={TextVariant.HEADING} color={themeColors.white} center style={styles.amountText}>
          {formatCurrency(totalSavings)}
        </BText>

        {/* Subtitle */}
        <BText variant={TextVariant.CAPTION} color={themeColors.white} center style={{ opacity: 0.85 }}>
          {SAVINGS_SCREEN_STRINGS.headerSubtitle}
        </BText>

        {/* Tabs */}
        <BView row gap={SpacingValue.SM} style={styles.tabsRow}>
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <BButton
                key={tab.key}
                variant={ButtonVariant.GHOST}
                onPress={() => setActiveTab(tab.key)}
                padding={SpacingValue.NONE}
                style={{ flex: 1 }}
              >
                <BCard
                  style={[
                    styles.tabPill,
                    isActive
                      ? { backgroundColor: themeColors.white }
                      : { backgroundColor: 'transparent', borderWidth: 0 },
                  ]}
                >
                  <BView center gap={SpacingValue.XXS}>
                    <BIcon
                      name={tab.activeIcon as any}
                      size={isActive ? 'md' : 'sm'}
                      color={isActive ? activeTabColor(tab.activeIconColor) : 'rgba(255,255,255,0.7)'}
                    />
                    <BText
                      variant={TextVariant.CAPTION}
                      color={isActive ? activeTabColor(tab.activeIconColor) : themeColors.white}
                      style={isActive ? styles.activeTabText : { opacity: 0.85 }}
                    >
                      {tab.label}
                    </BText>
                  </BView>
                </BCard>
              </BButton>
            );
          })}
        </BView>
      </LinearGradient>

      {/* Tab Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {activeTab === SavingsTab.OVERVIEW && (
          <SavingsOverviewTab
            savingsGoals={savingsGoals}
            savingsBalancesAllGoals={savingsBalancesAllGoals}
            adHocSavingsBalances={adHocSavingsBalances}
            monthlyDepositsByGoal={monthlyDepositsByGoal}
          />
        )}
        {activeTab === SavingsTab.DEPOSIT && <SavingsDepositTab onSuccess={handleDepositSuccess} />}
        {activeTab === SavingsTab.WITHDRAW && (
          <BView center padding={SpacingValue.XL}>
            <BText variant={TextVariant.BODY} muted>
              {SAVINGS_SCREEN_STRINGS.withdraw.title}
            </BText>
          </BView>
        )}
      </ScrollView>
      <BToast
        visible={toastVisible}
        message={toastMessage}
        variant={ToastVariant.SUCCESS}
        onDismiss={() => setToastVisible(false)}
      />
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  walletIconContainer: {
    width: IconSize['2xl'],
    height: IconSize['2xl'],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  amountText: {
    marginBottom: Spacing.xs,
  },
  tabsRow: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  tabPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    fontWeight: '600',
  },
});
