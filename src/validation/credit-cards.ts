import { CreditCardProvider, CreditCardProviderEnum } from '@/db/types';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { z } from 'zod';

const { validation } = CREDIT_CARDS_SETTINGS_STRINGS;

const providerSchema = z
  .string()
  .min(1, { message: validation.required })
  .refine((value) => Object.values(CreditCardProviderEnum).includes(value as CreditCardProvider), {
    message: validation.required,
  })
  .transform((value) => value as CreditCardProvider);

const requiredNumber = (message: string) => z.number().refine((value) => !Number.isNaN(value), { message });

export const creditCardSchema = z.object({
  nickname: z.string().min(1, { message: validation.required }),
  provider: providerSchema,
  bank: z.string().min(1, { message: validation.required }),
  last4: z.string().regex(/^\d{4}$/, { message: validation.last4 }),
  creditLimit: z.number().positive({ message: validation.creditLimit }),
  statementDayOfMonth: requiredNumber(validation.required)
    .int()
    .min(1, { message: validation.statementDay })
    .max(31, { message: validation.statementDay }),
  paymentBufferDays: requiredNumber(validation.required).int().min(0, { message: validation.bufferDays }),
});

export type CreditCardFormData = z.infer<typeof creditCardSchema>;
