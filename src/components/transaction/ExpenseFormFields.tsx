/**
 * ExpenseFormFields
 *
 * Reusable form fields (amount, category, date, description, credit card)
 * extracted from addTransactionModal. Used by both the modal and the detail screen.
 */

import type { FC } from 'react';

import { BDropdown, BInput, BText, BView } from '@/src/components/ui';
import { SpacingValue, TextVariant } from '@/src/constants/theme';
import { TransactionFieldType } from '@/src/types/transaction';
import type { TransactionField } from '@/src/types/transaction';

export type ExpenseFormFieldsProps = {
  fields: TransactionField[];
};

const ExpenseFormFields: FC<ExpenseFormFieldsProps> = ({ fields }) => {
  return (
    <>
      {fields.map((item) => (
        <BView key={item.key} gap={SpacingValue.XS} marginY={SpacingValue.SM}>
          <BText variant={TextVariant.LABEL}>{item.label}</BText>

          {item.type === TransactionFieldType.INPUT && (
            <BInput
              placeholder={item.placeholder}
              value={item.value}
              onChangeText={item.onValueChange}
              keyboardType={item.keyboardType}
              multiline={item.multiline}
              numberOfLines={item.numberOfLines}
              leftIcon={item.leftIcon}
            />
          )}

          {item.type === TransactionFieldType.DROPDOWN && item.options && (
            <BDropdown
              options={item.options}
              value={item.value}
              onValueChange={item.onValueChange}
              placeholder={item.placeholder}
              searchable={true}
              modalTitle={item.modalTitle}
            />
          )}
        </BView>
      ))}
    </>
  );
};

export default ExpenseFormFields;
