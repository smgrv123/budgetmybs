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
