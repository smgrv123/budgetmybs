import { BUDGET_OVERVIEW_ITEMS } from '@/src/constants/settings.config';
import { SETTINGS_SCREEN_STRINGS } from '@/src/constants/settings.strings';
import { CardVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import React, { FC } from 'react';
import { BCard, BText, BView } from '../ui';
import BudgetOverviewRow from './budgetOverviewRow';

const SettingsBudgetSection: FC<{
  values: {
    salary: number;
    fixedExpenses: number;
    debtPayments: number;
  };
}> = ({ values }) => {
  return (
    <BView gap={SpacingValue.MD}>
      <BText variant={TextVariant.SUBHEADING}>{SETTINGS_SCREEN_STRINGS.budgetOverviewTitle}</BText>
      <BCard variant={CardVariant.ELEVATED}>
        {BUDGET_OVERVIEW_ITEMS.map(({ key, ...item }) => (
          <BudgetOverviewRow key={key} {...item} value={values[item.valueKey]} />
        ))}
      </BCard>
    </BView>
  );
};

export default SettingsBudgetSection;
