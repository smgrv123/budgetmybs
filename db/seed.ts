import { db } from './client';
import { categoriesTable } from './schema';
import { CategoryTypeEnum } from './types';

/**
 * Predefined categories with icons and colors
 */
const PREDEFINED_CATEGORIES = [
  {
    name: 'Food & Dining',
    type: CategoryTypeEnum.FOOD,
    icon: 'restaurant-outline', // Ionicons
    color: '#FF6B6B',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Shopping',
    type: CategoryTypeEnum.SHOPPING,
    icon: 'cart-outline', // Ionicons
    color: '#4ECDC4',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Entertainment',
    type: CategoryTypeEnum.ENTERTAINMENT,
    icon: 'film-outline', // Ionicons
    color: '#45B7D1',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Healthcare',
    type: CategoryTypeEnum.HEALTHCARE,
    icon: 'medical-outline', // Ionicons
    color: '#96CEB4',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Education',
    type: CategoryTypeEnum.EDUCATION,
    icon: 'school-outline', // Ionicons
    color: '#FFEAA7',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Personal Care',
    type: CategoryTypeEnum.PERSONAL_CARE,
    icon: 'cut-outline', // Ionicons
    color: '#DDA0DD',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Gifts',
    type: CategoryTypeEnum.GIFTS,
    icon: 'gift-outline', // Ionicons
    color: '#FFB6C1',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Travel',
    type: CategoryTypeEnum.TRAVEL,
    icon: 'airplane-outline', // Ionicons
    color: '#87CEEB',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Fitness',
    type: CategoryTypeEnum.FITNESS,
    icon: 'fitness-outline', // Ionicons
    color: '#98D8C8',
    isPredefined: 1,
    isActive: 1,
  },
  {
    name: 'Other',
    type: CategoryTypeEnum.OTHER,
    icon: 'ellipsis-horizontal-outline', // Ionicons
    color: '#B0B0B0',
    isPredefined: 1,
    isActive: 1,
  },
];

/**
 * Seeds the database with predefined categories
 * Should be run once on first app launch
 */
export const seedCategories = async (): Promise<void> => {
  const existing = await db.select().from(categoriesTable).limit(1);

  if (existing.length === 0) {
    await db.insert(categoriesTable).values(PREDEFINED_CATEGORIES);
    console.log('✅ Seeded predefined categories');
  } else {
    console.log('⏭️ Categories already exist, skipping seed');
  }
};

/**
 * Force reseed categories (useful for development)
 * WARNING: This will delete all existing categories
 */
export const forceReseedCategories = async (): Promise<void> => {
  await db.delete(categoriesTable);
  await db.insert(categoriesTable).values(PREDEFINED_CATEGORIES);
  console.log('✅ Force reseeded predefined categories');
};
