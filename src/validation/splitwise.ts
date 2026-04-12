/**
 * Zod schemas for Splitwise API response validation.
 *
 * Rules:
 *  - Use .loose() (not .passthrough()) for objects — Zod v4 project standard.
 *  - Use `error:` (not `invalid_type_error:`) for custom error messages.
 */
import { z } from 'zod';

// ============================================
// PICTURE SCHEMA
// ============================================

export const SplitwisePictureSchema = z
  .object({
    small: z.string().nullable().optional(),
    medium: z.string().nullable().optional(),
    large: z.string().nullable().optional(),
  })
  .loose();

// ============================================
// USER SCHEMA
// ============================================

export const SplitwiseUserSchema = z
  .object({
    id: z.number({ error: 'User id must be a number.' }),
    first_name: z.string({ error: 'first_name must be a string.' }),
    last_name: z.string().nullable().optional(),
    email: z.string({ error: 'email must be a string.' }),
    picture: SplitwisePictureSchema.nullable().optional(),
  })
  .loose();

// ============================================
// CURRENT USER RESPONSE SCHEMA
// ============================================

export const SplitwiseCurrentUserResponseSchema = z
  .object({
    user: SplitwiseUserSchema,
  })
  .loose();

// ============================================
// TOKEN RESPONSE SCHEMA
// ============================================

export const SplitwiseTokenResponseSchema = z
  .object({
    access_token: z.string({ error: 'access_token must be a string.' }),
    refresh_token: z.string().nullable().optional(),
    expires_in: z.number().nullable().optional(),
    token_type: z.string().default('Bearer'),
  })
  .loose();

export type SplitwiseTokenResponse = z.infer<typeof SplitwiseTokenResponseSchema>;
export type SplitwiseCurrentUserResponse = z.infer<typeof SplitwiseCurrentUserResponseSchema>;

// ============================================
// EXPENSE USER SCHEMA
// ============================================

export const SplitwiseExpenseUserSchema = z
  .object({
    user_id: z.number(),
    paid_share: z.string(),
    owed_share: z.string(),
    user: z
      .object({
        id: z.number(),
        first_name: z.string(),
      })
      .loose(),
  })
  .loose();

// ============================================
// EXPENSE SCHEMA
// ============================================

export const SplitwiseExpenseSchema = z
  .object({
    id: z.number(),
    description: z.string(),
    cost: z.string(),
    currency_code: z.string(),
    date: z.string(),
    deleted_at: z.string().nullable().optional(),
    payment: z.boolean(),
    updated_at: z.string(),
    category: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .loose(),
    users: z.array(SplitwiseExpenseUserSchema),
  })
  .loose();

export const SplitwiseExpensesResponseSchema = z
  .object({
    expenses: z.array(SplitwiseExpenseSchema),
  })
  .loose();

export type SplitwiseExpensesResponse = z.infer<typeof SplitwiseExpensesResponseSchema>;
export type SplitwiseExpenseData = z.infer<typeof SplitwiseExpenseSchema>;
export type SplitwiseCurrentUserApiResponse = z.infer<typeof SplitwiseCurrentUserResponseSchema>;
