import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { AsyncStorageKeys } from '@/constants/asyncStorageKeys';
import { OnboardingStrings } from '@/constants/onboarding.strings';
import { ButtonVariant, ComponentSize, Spacing, SpacingValue, TextVariant } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  BAccordion,
  BButton,
  BIcon,
  BPlanLoadingView,
  BSafeAreaView,
  BText,
  BudgetAllocationCard,
  BView,
  HealthScoreCard,
  InsightCard,
  RecommendationCard,
  SuggestedChangeCard,
  SummaryCard,
} from '@/src/components';
import { generateFinancialPlan } from '@/src/services/financialPlanService';
import { useOnboardingStore } from '@/src/store';
import type { FinancialPlan } from '@/src/types/financialPlan';
import { applyAISuggestions } from '@/src/utils/applyAISuggestions';
import { formatIndianNumber } from '@/src/utils/format';
import { ensureNetworkAvailable, NetworkError, pollNetworkConnection } from '@/src/utils/network';
import { useSaveOnboardingData } from '@/src/utils/saveOnboardingData';

const { plan } = OnboardingStrings;

export default function ConfirmationScreen() {
  const themeColors = useThemeColors();
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [aiPlan, setAIPlan] = useState<FinancialPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { profile, fixedExpenses, debts, savingsGoals, reset } = useOnboardingStore();

  const { saveOnboardingData } = useSaveOnboardingData();

  // Generate AI plan on mount with network monitoring
  useEffect(() => {
    let networkPollCleanup: (() => void) | null = null;

    const loadAIPlan = async () => {
      try {
        // Check network first
        await ensureNetworkAvailable();

        // Start network polling every 3 seconds
        networkPollCleanup = pollNetworkConnection(() => {
          router.replace('/onboarding/network');
        });

        // Generate plan
        const generatedPlan = await generateFinancialPlan({
          profile,
          fixedExpenses,
          debts,
          savingsGoals,
        });
        setAIPlan(generatedPlan);

        // Store health score weights in AsyncStorage
        await AsyncStorage.setItem(
          AsyncStorageKeys.HEALTH_SCORE_WEIGHTS,
          JSON.stringify({
            original: generatedPlan.originalHealthScoreWeights,
            suggested: generatedPlan.suggestedHealthScoreWeights,
            generatedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error('Failed to generate AI plan:', error);
        const errorPath = error instanceof NetworkError ? '/onboarding/network' : '/onboarding/api_failure';
        router.replace(errorPath);
      } finally {
        setIsLoadingAI(false);
        // Stop network polling
        if (networkPollCleanup) {
          networkPollCleanup();
        }
      }
    };

    loadAIPlan();

    return () => {
      if (networkPollCleanup) {
        networkPollCleanup();
      }
    };
  }, [profile, fixedExpenses, debts, savingsGoals]);

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = async (acceptAI: boolean) => {
    setIsSaving(true);

    try {
      // Step 1: Apply AI suggestions to store if user accepts
      if (acceptAI && aiPlan) {
        applyAISuggestions(aiPlan, useOnboardingStore.getState());
      }

      // Step 2: Get current data from store using destructuring
      const {
        profile: currentProfile,
        fixedExpenses: currentFixedExpenses,
        debts: currentDebts,
        savingsGoals: currentSavingsGoals,
      } = useOnboardingStore.getState();

      // Step 3: Save all data using utility function
      await saveOnboardingData({
        profile: currentProfile,
        fixedExpenses: currentFixedExpenses,
        debts: currentDebts,
        savingsGoals: currentSavingsGoals,
      });

      // Step 4: Update health score weights with user choice
      if (aiPlan) {
        await AsyncStorage.setItem(
          AsyncStorageKeys.HEALTH_SCORE_WEIGHTS,
          JSON.stringify({
            original: aiPlan.originalHealthScoreWeights,
            suggested: aiPlan.suggestedHealthScoreWeights,
            usedSuggested: acceptAI,
            generatedAt: new Date().toISOString(),
          })
        );
      }

      reset();
      router.replace('/onboarding/success');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      Alert.alert('Error', 'Failed to save your data. Please try again.');
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoadingAI) {
    return <BPlanLoadingView />;
  }

  // Safety check - shouldn't happen but just in case
  if (!aiPlan) {
    return null;
  }

  return (
    <BSafeAreaView>
      {/* Top Back Button */}
      <BView row gap={SpacingValue.MD} paddingX={SpacingValue.LG} paddingY={SpacingValue.SM}>
        <TouchableOpacity onPress={handleBack}>
          <BIcon name="arrow-back" size={ComponentSize.MD} color={themeColors.text} />
        </TouchableOpacity>
        <BIcon name="sparkles" color={themeColors.warning} size={ComponentSize.MD} />
        <BText variant={TextVariant.SUBHEADING}>{plan.headerTitle}</BText>
      </BView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Health Score Card */}
        <HealthScoreCard originalScore={aiPlan.originalHealthScore} suggestedScore={aiPlan.suggestedHealthScore} />

        {/* Budget Allocation Accordion */}
        <BView marginY={SpacingValue.SM}>
          <BAccordion icon="wallet-outline" title={OnboardingStrings.aiPlan.budgetAllocation}>
            <BView gap={SpacingValue.MD}>
              {aiPlan.budgetAllocation.map((item, index) => (
                <BudgetAllocationCard key={index} {...item} />
              ))}
              {/* Total Income Row */}
              <BView
                row
                justify="space-between"
                paddingY={SpacingValue.SM}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                }}
              >
                <BText variant={TextVariant.LABEL}>{OnboardingStrings.aiPlan.totalMonthlyIncome}</BText>
                <BText variant={TextVariant.LABEL}>{formatIndianNumber(profile.salary, true)}</BText>
              </BView>
            </BView>
          </BAccordion>
        </BView>

        {/* Suggested Changes Accordion */}
        {aiPlan.suggestedChanges.length > 0 && (
          <BView marginY={SpacingValue.SM}>
            <BAccordion icon="swap-horizontal" title={OnboardingStrings.aiPlan.suggestedChanges}>
              <BView gap={SpacingValue.MD}>
                {aiPlan.suggestedChanges.map((change, index) => (
                  <SuggestedChangeCard key={index} {...change} />
                ))}
              </BView>
            </BAccordion>
          </BView>
        )}

        {/* Key Insights Accordion */}
        {aiPlan.keyInsights.length > 0 && (
          <BView marginY={SpacingValue.SM}>
            <BAccordion icon="bulb" title={OnboardingStrings.aiPlan.keyInsights}>
              <BView gap={SpacingValue.SM}>
                {aiPlan.keyInsights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}
              </BView>
            </BAccordion>
          </BView>
        )}

        {/* Recommendations Accordion */}
        {aiPlan.recommendations.length > 0 && (
          <BView marginY={SpacingValue.SM}>
            <BAccordion icon="checkmark-circle" title={OnboardingStrings.aiPlan.recommendations}>
              <BView gap={SpacingValue.MD}>
                {aiPlan.recommendations.map((rec, index) => (
                  <RecommendationCard key={index} {...rec} />
                ))}
              </BView>
            </BAccordion>
          </BView>
        )}

        {/* AI Summary */}
        <BView marginY={SpacingValue.BASE}>
          <SummaryCard summary={aiPlan.summary} />
        </BView>
      </ScrollView>

      {/* Footer - Two Action Buttons */}
      <BView
        row
        gap={SpacingValue.MD}
        paddingX={SpacingValue.XL}
        paddingY={SpacingValue.BASE}
        style={[styles.footer, { borderTopColor: themeColors.border }]}
      >
        <BButton
          variant={ButtonVariant.SECONDARY}
          onPress={() => handleConfirm(false)}
          disabled={isSaving}
          rounded={SpacingValue.LG}
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.text}>
            {OnboardingStrings.aiPlan.keepOriginal}
          </BText>
        </BButton>
        <BButton
          onPress={() => handleConfirm(true)}
          loading={isSaving}
          disabled={isSaving}
          rounded={SpacingValue.LG}
          style={{ flex: 1 }}
        >
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {OnboardingStrings.aiPlan.acceptPlan}
          </BText>
        </BButton>
      </BView>
    </BSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  footer: {
    borderTopWidth: 1,
  },
});
