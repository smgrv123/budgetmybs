import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { profileTable } from '../schema';
import type { CreateProfileInput, UpdateProfileInput } from '../schema-types';

// ============================================
// GET PROFILE
// ============================================

export const getProfile = async () => {
  const result = await db.select().from(profileTable).limit(1);
  return result[0] ?? null;
};

// ============================================
// UPSERT PROFILE
// ============================================

export const upsertProfile = async (data: CreateProfileInput) => {
  const existing = await getProfile();
  if (existing) {
    await db
      .update(profileTable)
      .set({
        ...data,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(profileTable.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(profileTable).values(data).returning();
    return result[0];
  }
};

// ============================================
// UPDATE PROFILE
// ============================================

export const updateProfile = async (updateData: UpdateProfileInput) => {
  const existing = await getProfile();
  if (!existing) throw new Error('Profile not found');

  const result = await db
    .update(profileTable)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(profileTable.id, existing.id))
    .returning();

  return result[0];
};
