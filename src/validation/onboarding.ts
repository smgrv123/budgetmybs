import { OnboardingStrings } from '@/constants/onboarding.strings';
import { z } from 'zod';

const { validation } = OnboardingStrings;

// ============================================
// PROFILE SCHEMA
// ============================================

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, { message: validation.required })
    .max(50, { message: validation.maxLength(50) })
    .regex(/[a-zA-Z]/, { message: 'Name must contain at least one letter' }),
  salary: z.number().positive({ message: validation.positiveNumber }),
  monthlySavingsTarget: z.number().min(0, { message: validation.minValue(0) }),
  frivolousBudget: z.number().min(0, { message: validation.minValue(0) }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================
// FIXED EXPENSE SCHEMA
// ============================================

export const fixedExpenseSchema = z.object({
  name: z
    .string()
    .min(1, { message: validation.required })
    .max(100, { message: validation.maxLength(100) }),
  type: z.string().min(1, { message: validation.required }),
  customType: z.string().optional(),
  amount: z.number().positive({ message: validation.positiveNumber }),
  dayOfMonth: z
    .number()
    .int()
    .min(1, { message: validation.dayOfMonth })
    .max(31, { message: validation.dayOfMonth })
    .optional()
    .nullable(),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

// ============================================
// DEBT SCHEMA
// ============================================

export const debtSchema = z.object({
  name: z
    .string()
    .min(1, { message: validation.required })
    .max(100, { message: validation.maxLength(100) }),
  type: z.string().min(1, { message: validation.required }),
  customType: z.string().optional(),
  principal: z.number().positive({ message: validation.positiveNumber }),
  interestRate: z
    .number()
    .min(0, { message: validation.minValue(0) })
    .max(100, { message: validation.interestRate }),
  tenureMonths: z.number().int().positive({ message: validation.positiveNumber }),
});

export type DebtFormData = z.infer<typeof debtSchema>;

// ============================================
// SAVINGS GOAL SCHEMA
// ============================================

export const savingsGoalSchema = z.object({
  name: z
    .string()
    .min(1, { message: validation.required })
    .max(100, { message: validation.maxLength(100) }),
  type: z.string().min(1, { message: validation.required }),
  customType: z.string().optional(),
  targetAmount: z.number().positive({ message: validation.positiveNumber }),
});

export type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Safely validate form data and return errors
 */
export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  const issues = result.error.issues || [];
  for (const issue of issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

/**
 * Get first error message for a field
 */
export function getFieldError(errors: Record<string, string> | undefined, field: string): string | undefined {
  return errors?.[field];
}
