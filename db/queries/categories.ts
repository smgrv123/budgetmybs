import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { categoriesTable } from '../schema';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schema-types';

// ============================================
// GET ALL CATEGORIES
// ============================================

export const getAllCategories = async (activeOnly = true) => {
  if (activeOnly) {
    return db.select().from(categoriesTable).where(eq(categoriesTable.isActive, 1));
  }
  return db.select().from(categoriesTable);
};

// ============================================
// GET PREDEFINED CATEGORIES
// ============================================

export const getPredefinedCategories = async () => {
  return db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.isPredefined, 1), eq(categoriesTable.isActive, 1)));
};

// ============================================
// GET CUSTOM CATEGORIES
// ============================================

export const getCustomCategories = async () => {
  return db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.isPredefined, 0), eq(categoriesTable.isActive, 1)));
};

// ============================================
// GET CATEGORY BY ID
// ============================================

export const getCategoryById = async (id: string) => {
  const result = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);

  return result[0] ?? null;
};

// ============================================
// CREATE CATEGORY
// ============================================

export const createCategory = async (data: CreateCategoryInput) => {
  const result = await db
    .insert(categoriesTable)
    .values({
      ...data,
      customType: data.customType ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isPredefined: 0,
    })
    .returning();

  return result[0];
};

// ============================================
// UPDATE CATEGORY
// ============================================

export const updateCategory = async (id: string, updateData: UpdateCategoryInput) => {
  const result = await db.update(categoriesTable).set(updateData).where(eq(categoriesTable.id, id)).returning();

  return result[0];
};

// ============================================
// DELETE CATEGORY
// ============================================

export const deleteCategory = async (id: string) => {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
};
