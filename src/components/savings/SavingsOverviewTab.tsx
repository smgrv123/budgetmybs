import type { FC } from 'react';

import type { AdHocSavingsBalance, GoalSavingsBalance, MonthlyGoalDeposit, SavingsGoal } from '@/db/schema-types';
import type { SavingsType } from '@/db/types';
import { BText, BView } from '@/src/components/ui';
import { SAVINGS_SCREEN_STRINGS } from '@/src/constants/savings-screen.strings';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import AdHocSavingsAccordion from './AdHocSavingsAccordion';
import SavingsGoalCard from './SavingsGoalCard';

export type SavingsOverviewTabProps = {
  savingsGoals: SavingsGoal[];
  savingsBalancesAllGoals: GoalSavingsBalance[];
  adHocSavingsBalances: AdHocSavingsBalance[];
  monthlyDepositsByGoal: MonthlyGoalDeposit[];
};

const SavingsOverviewTab: FC<SavingsOverviewTabProps> = ({
  savingsGoals,
  savingsBalancesAllGoals,
  adHocSavingsBalances,
  monthlyDepositsByGoal,
}) => {
  const hasGoals = savingsGoals.length > 0;
  const hasAdHoc = adHocSavingsBalances.length > 0;

  if (!hasGoals && !hasAdHoc) {
    return (
      <BView center padding={SpacingValue.XL}>
        <BText variant={TextVariant.BODY} muted>
          {SAVINGS_SCREEN_STRINGS.overview.noGoals}
        </BText>
      </BView>
    );
  }

  return (
    <BView gap={SpacingValue.MD} padding={SpacingValue.BASE}>
      {/* Goal cards */}
      {savingsGoals.map((goal) => {
        const balance = savingsBalancesAllGoals.find((b) => b.goalId === goal.id);
        const monthlyDeposit = monthlyDepositsByGoal.find((d) => d.goalId === goal.id);

        return (
          <SavingsGoalCard
            key={goal.id}
            goalId={goal.id}
            goalName={goal.name}
            goalType={goal.type as SavingsType}
            targetAmount={goal.targetAmount}
            allTimeTotal={balance?.net ?? 0}
            monthlyDeposited={monthlyDeposit?.totalDeposited ?? 0}
          />
        );
      })}

      {/* Ad-hoc accordion */}
      {hasAdHoc && <AdHocSavingsAccordion balances={adHocSavingsBalances} />}
    </BView>
  );
};

export default SavingsOverviewTab;
