import { USER_INCOME_TYPES } from '@/db/types';
import { INCOME_FORM_STRINGS } from '@/src/constants/income.strings';
import { z } from 'zod';

const { validation } = INCOME_FORM_STRINGS;

export const incomeFormSchema = z
  .object({
    amount: z.number().positive({ message: validation.amountRequired }),
    type: z
      .string()
      .min(1, { message: validation.typeRequired })
      .refine((v) => USER_INCOME_TYPES.includes(v as (typeof USER_INCOME_TYPES)[number]), {
        message: validation.typeRequired,
      }),
    customType: z.string().optional(),
    description: z.string().optional(),
    date: z.string().min(1),
  })
  .refine(
    (data) => {
      if (data.type === 'other') {
        return data.customType && data.customType.trim().length > 0;
      }
      return true;
    },
    {
      message: validation.customTypeRequired,
      path: ['customType'],
    }
  );

export type IncomeFormData = z.infer<typeof incomeFormSchema>;
