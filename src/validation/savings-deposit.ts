import { SAVINGS_TYPES } from '@/db/types';
import { SAVINGS_DEPOSIT_STRINGS } from '@/src/constants/savings-deposit.strings';
import { z } from 'zod';

const { validation } = SAVINGS_DEPOSIT_STRINGS;

export const savingsDepositSchema = z.object({
  amount: z.number().positive({ message: validation.amountRequired }),
  savingsType: z
    .string()
    .min(1, { message: validation.savingsTypeRequired })
    .refine((v) => SAVINGS_TYPES.includes(v as (typeof SAVINGS_TYPES)[number]), {
      message: validation.savingsTypeRequired,
    }),
  savingsGoalId: z.string().nullable().optional(),
  description: z.string().optional(),
});

export type SavingsDepositFormData = z.infer<typeof savingsDepositSchema>;
