import { SAVINGS_DEPOSIT_STRINGS } from '@/src/constants/savings-deposit.strings';
import { z } from 'zod';

const { withdrawalValidation } = SAVINGS_DEPOSIT_STRINGS;

export const savingsWithdrawalSchema = z.object({
  amount: z.number().positive({ message: withdrawalValidation.amountRequired }),
  sourceKey: z.string().min(1, { message: withdrawalValidation.sourceRequired }),
  availableBalance: z.number(),
});

export type SavingsWithdrawalFormData = z.infer<typeof savingsWithdrawalSchema>;
