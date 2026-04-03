import { createElement } from 'react';

import { INCOME_FORM_STRINGS } from '@/src/constants/income.strings';
import { IncomeFieldKey, type IncomeField, type IncomeFieldConfig, type IncomeFormValues } from '@/src/types/income';
import { BText } from '../ui';

type CreateIncomeFieldsParams = {
  configs: IncomeFieldConfig[];
  values: IncomeFormValues;
  handleChange: (key: string, value: string) => void;
  errors?: Partial<Record<string, string>>;
};

export const createIncomeFields = ({
  configs,
  values,
  handleChange,
  errors,
}: CreateIncomeFieldsParams): IncomeField[] => {
  const currencyIcon = createElement(BText, { muted: true }, INCOME_FORM_STRINGS.currencySymbol);

  return configs
    .filter((config) => !config.showWhen || config.showWhen(values))
    .map((config) => ({
      key: config.key,
      type: config.type,
      label: config.label,
      placeholder: config.placeholder,
      modalTitle: config.modalTitle,
      value: values[config.key as keyof IncomeFormValues] ?? '',
      onValueChange: (value: string | number) => handleChange(config.key, String(value)),
      keyboardType: config.keyboardType,
      leftIcon: config.hasCurrencyIcon ? currencyIcon : undefined,
      searchable: config.searchable,
      options: config.options,
      error: errors?.[config.key],
    }));
};

export const INCOME_FIELD_KEYS_WITH_ERRORS = [
  IncomeFieldKey.AMOUNT,
  IncomeFieldKey.TYPE,
  IncomeFieldKey.CUSTOM_TYPE,
] as const;
