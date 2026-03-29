import { IncomeLabels, IncomeTypeEnum, USER_INCOME_TYPES } from '@/db/types';
import { INCOME_FORM_STRINGS } from '@/src/constants/income.strings';
import { IncomeFieldKey, IncomeFieldType, type IncomeFieldConfig, type IncomeFormValues } from '@/src/types/income';
import { TransactionKeyboardType } from '@/src/types/transaction';

const incomeTypeOptions = USER_INCOME_TYPES.map((type) => ({
  value: type,
  label: IncomeLabels[type],
}));

const isOtherType = (values: IncomeFormValues) => values.type === IncomeTypeEnum.OTHER;

export const INCOME_FIELD_CONFIGS: IncomeFieldConfig[] = [
  {
    key: IncomeFieldKey.AMOUNT,
    type: IncomeFieldType.INPUT,
    label: INCOME_FORM_STRINGS.amountLabel,
    placeholder: INCOME_FORM_STRINGS.amountPlaceholder,
    keyboardType: TransactionKeyboardType.DECIMAL_PAD,
    hasCurrencyIcon: true,
  },
  {
    key: IncomeFieldKey.TYPE,
    type: IncomeFieldType.DROPDOWN,
    label: INCOME_FORM_STRINGS.typeLabel,
    placeholder: INCOME_FORM_STRINGS.typePlaceholder,
    modalTitle: INCOME_FORM_STRINGS.typeModalTitle,
    searchable: true,
    options: incomeTypeOptions,
  },
  {
    key: IncomeFieldKey.CUSTOM_TYPE,
    type: IncomeFieldType.INPUT,
    label: INCOME_FORM_STRINGS.customTypeLabel,
    placeholder: INCOME_FORM_STRINGS.customTypePlaceholder,
    showWhen: isOtherType,
  },
  {
    key: IncomeFieldKey.DESCRIPTION,
    type: IncomeFieldType.INPUT,
    label: INCOME_FORM_STRINGS.descriptionLabel,
    placeholder: INCOME_FORM_STRINGS.descriptionPlaceholder,
  },
  {
    key: IncomeFieldKey.DATE,
    type: IncomeFieldType.INPUT,
    label: INCOME_FORM_STRINGS.dateLabel,
    placeholder: INCOME_FORM_STRINGS.datePlaceholder,
  },
];
