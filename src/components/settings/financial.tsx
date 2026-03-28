import { SETTINGS_SCREEN_STRINGS } from '@/src/constants/settings.strings';
import { CardVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { FinancialDataItem } from '@/src/types/settings';
import React, { type FC } from 'react';
import { BCard, BText, BView } from '../ui';
import FinancialDataRow from './financialDataRow';

const SettingsFinancialSection: FC<{
  financialDataItems: FinancialDataItem[];
  counts: {
    fixedExpenses: number;
    debts: number;
    savings: number;
    creditCards: number;
    income: number;
  };
}> = ({ financialDataItems, counts }) => {
  return (
    <BView gap={SpacingValue.MD}>
      <BText variant={TextVariant.SUBHEADING}>{SETTINGS_SCREEN_STRINGS.financialDataTitle}</BText>
      <BCard variant={CardVariant.ELEVATED}>
        {financialDataItems.map(({ key, ...item }) => (
          <FinancialDataRow key={key} {...item} count={counts[key]} />
        ))}
      </BCard>
    </BView>
  );
};

export default SettingsFinancialSection;
