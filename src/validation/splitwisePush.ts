/**
 * Zod schemas for Splitwise push (outbound) API responses.
 *
 * Rules:
 *  - Use .loose() (not .passthrough()) for objects — Zod v4 project standard.
 *  - Use `error:` (not `invalid_type_error:`) for custom error messages.
 */
import { z } from 'zod';

import { SplitwisePushAction } from '@/src/constants/splitwise.config';

// ============================================
// FRIENDS API RESPONSE
// ============================================

export const SplitwiseFriendSchema = z
  .object({
    id: z.number({ error: 'Friend id must be a number.' }),
    first_name: z.string({ error: 'first_name must be a string.' }),
    last_name: z.string().nullable().optional(),
    email: z.string({ error: 'email must be a string.' }),
  })
  .loose();

export const SplitwiseFriendsResponseSchema = z
  .object({
    friends: z.array(SplitwiseFriendSchema),
  })
  .loose();

export type SplitwiseFriend = z.infer<typeof SplitwiseFriendSchema>;
export type SplitwiseFriendsResponse = z.infer<typeof SplitwiseFriendsResponseSchema>;

// ============================================
// GROUPS API RESPONSE
// ============================================

export const SplitwiseGroupMemberSchema = z
  .object({
    id: z.number({ error: 'Group member id must be a number.' }),
    first_name: z.string({ error: 'first_name must be a string.' }),
    last_name: z.string().nullable().optional(),
  })
  .loose();

export const SplitwiseGroupSchema = z
  .object({
    id: z.number({ error: 'Group id must be a number.' }),
    name: z.string({ error: 'Group name must be a string.' }),
    members: z.array(SplitwiseGroupMemberSchema).optional(),
  })
  .loose();

export const SplitwiseGroupsResponseSchema = z
  .object({
    groups: z.array(SplitwiseGroupSchema),
  })
  .loose();

export type SplitwiseGroupMember = z.infer<typeof SplitwiseGroupMemberSchema>;
export type SplitwiseGroup = z.infer<typeof SplitwiseGroupSchema>;
export type SplitwiseGroupsResponse = z.infer<typeof SplitwiseGroupsResponseSchema>;

// ============================================
// CREATE EXPENSE RESPONSE
// ============================================

export const SplitwiseCreateExpenseResponseSchema = z
  .object({
    expenses: z.array(
      z
        .object({
          id: z.number({ error: 'Expense id must be a number.' }),
        })
        .loose()
    ),
  })
  .loose();

export type SplitwiseCreateExpenseResponse = z.infer<typeof SplitwiseCreateExpenseResponseSchema>;

// ============================================
// PUSH QUEUE ITEM
// ============================================

export const SplitwisePushActionSchema = z.enum([
  SplitwisePushAction.CREATE,
  SplitwisePushAction.UPDATE,
  SplitwisePushAction.DELETE,
] as [string, ...string[]]);

export const SplitwisePushQueueItemSchema = z
  .object({
    expenseId: z.string({ error: 'expenseId must be a string.' }),
    action: SplitwisePushActionSchema,
    payload: z.record(z.string(), z.unknown()),
    queuedAt: z.string({ error: 'queuedAt must be a string.' }),
    attempts: z.number({ error: 'attempts must be a number.' }),
  })
  .loose();

export const SplitwisePushQueueSchema = z.array(SplitwisePushQueueItemSchema);

export type SplitwisePushQueueItem = z.infer<typeof SplitwisePushQueueItemSchema>;
