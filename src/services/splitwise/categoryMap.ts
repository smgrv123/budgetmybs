/**
 * Static mapping from Splitwise category names to local CategoryType.
 *
 * Splitwise categories are matched case-insensitively. Unmapped categories
 * fall back to CategoryTypeEnum.OTHER.
 */

import { CategoryTypeEnum } from '@/db/types';
import type { CategoryType } from '@/db/types';

// ============================================
// SPLITWISE → LOCAL CATEGORY MAP
// ============================================

/**
 * Normalized (lowercase) Splitwise category name → local CategoryType.
 *
 * Splitwise top-level categories and common subcategories are covered.
 * See: https://dev.splitwise.com/#get-categories
 */
const SPLITWISE_CATEGORY_MAP: Record<string, CategoryType> = {
  // Food & drink
  'food and drink': CategoryTypeEnum.FOOD,
  'food & drink': CategoryTypeEnum.FOOD,
  food: CategoryTypeEnum.FOOD,
  groceries: CategoryTypeEnum.FOOD,
  'dining out': CategoryTypeEnum.FOOD,
  drinks: CategoryTypeEnum.FOOD,
  restaurant: CategoryTypeEnum.FOOD,
  'coffee shop': CategoryTypeEnum.FOOD,
  bar: CategoryTypeEnum.FOOD,
  'fast food': CategoryTypeEnum.FOOD,
  lunch: CategoryTypeEnum.FOOD,
  dinner: CategoryTypeEnum.FOOD,
  breakfast: CategoryTypeEnum.FOOD,

  // Transportation
  transportation: CategoryTypeEnum.BILLS,
  taxi: CategoryTypeEnum.BILLS,
  auto: CategoryTypeEnum.BILLS,
  bus: CategoryTypeEnum.BILLS,
  train: CategoryTypeEnum.BILLS,
  metro: CategoryTypeEnum.BILLS,
  parking: CategoryTypeEnum.BILLS,
  gas: CategoryTypeEnum.BILLS,
  petrol: CategoryTypeEnum.BILLS,
  fuel: CategoryTypeEnum.BILLS,
  car: CategoryTypeEnum.BILLS,
  bike: CategoryTypeEnum.BILLS,
  rideshare: CategoryTypeEnum.BILLS,
  uber: CategoryTypeEnum.BILLS,
  ola: CategoryTypeEnum.BILLS,
  rapido: CategoryTypeEnum.BILLS,

  // Travel
  travel: CategoryTypeEnum.TRAVEL,
  lodging: CategoryTypeEnum.TRAVEL,
  hotel: CategoryTypeEnum.TRAVEL,
  flights: CategoryTypeEnum.TRAVEL,
  flight: CategoryTypeEnum.TRAVEL,
  vacation: CategoryTypeEnum.TRAVEL,
  tourism: CategoryTypeEnum.TRAVEL,
  airfare: CategoryTypeEnum.TRAVEL,

  // Entertainment
  entertainment: CategoryTypeEnum.ENTERTAINMENT,
  movies: CategoryTypeEnum.ENTERTAINMENT,
  games: CategoryTypeEnum.ENTERTAINMENT,
  music: CategoryTypeEnum.ENTERTAINMENT,
  sports: CategoryTypeEnum.ENTERTAINMENT,
  concerts: CategoryTypeEnum.ENTERTAINMENT,
  theatre: CategoryTypeEnum.ENTERTAINMENT,
  netflix: CategoryTypeEnum.ENTERTAINMENT,
  streaming: CategoryTypeEnum.ENTERTAINMENT,
  ott: CategoryTypeEnum.ENTERTAINMENT,
  amusement: CategoryTypeEnum.ENTERTAINMENT,

  // Home / Utilities
  home: CategoryTypeEnum.BILLS,
  rent: CategoryTypeEnum.BILLS,
  utilities: CategoryTypeEnum.BILLS,
  electricity: CategoryTypeEnum.BILLS,
  water: CategoryTypeEnum.BILLS,
  internet: CategoryTypeEnum.BILLS,
  broadband: CategoryTypeEnum.BILLS,
  cable: CategoryTypeEnum.BILLS,
  maintenance: CategoryTypeEnum.BILLS,
  repairs: CategoryTypeEnum.BILLS,
  mortgage: CategoryTypeEnum.BILLS,
  'household supplies': CategoryTypeEnum.BILLS,
  'gas/electricity': CategoryTypeEnum.BILLS,
  phone: CategoryTypeEnum.BILLS,
  mobile: CategoryTypeEnum.BILLS,

  // Food delivery & quick commerce
  zomato: CategoryTypeEnum.FOOD,
  swiggy: CategoryTypeEnum.FOOD,
  zepto: CategoryTypeEnum.FOOD,
  blinkit: CategoryTypeEnum.FOOD,
  instamart: CategoryTypeEnum.FOOD,
  licious: CategoryTypeEnum.FOOD,

  // Shopping
  shopping: CategoryTypeEnum.SHOPPING,
  clothing: CategoryTypeEnum.SHOPPING,
  electronics: CategoryTypeEnum.SHOPPING,
  amazon: CategoryTypeEnum.SHOPPING,
  flipkart: CategoryTypeEnum.SHOPPING,
  'online shopping': CategoryTypeEnum.SHOPPING,

  // Healthcare
  health: CategoryTypeEnum.HEALTHCARE,
  healthcare: CategoryTypeEnum.HEALTHCARE,
  medical: CategoryTypeEnum.HEALTHCARE,
  pharmacy: CategoryTypeEnum.HEALTHCARE,
  doctor: CategoryTypeEnum.HEALTHCARE,
  hospital: CategoryTypeEnum.HEALTHCARE,
  dental: CategoryTypeEnum.HEALTHCARE,
  gym: CategoryTypeEnum.FITNESS,
  fitness: CategoryTypeEnum.FITNESS,
  yoga: CategoryTypeEnum.FITNESS,
  'sports and fitness': CategoryTypeEnum.FITNESS,

  // Education
  education: CategoryTypeEnum.EDUCATION,
  tuition: CategoryTypeEnum.EDUCATION,
  books: CategoryTypeEnum.EDUCATION,
  school: CategoryTypeEnum.EDUCATION,
  college: CategoryTypeEnum.EDUCATION,
  courses: CategoryTypeEnum.EDUCATION,

  // Personal care
  'personal care': CategoryTypeEnum.PERSONAL_CARE,
  beauty: CategoryTypeEnum.PERSONAL_CARE,
  haircut: CategoryTypeEnum.PERSONAL_CARE,
  salon: CategoryTypeEnum.PERSONAL_CARE,
  spa: CategoryTypeEnum.PERSONAL_CARE,

  // Gifts
  gifts: CategoryTypeEnum.GIFTS,
  gift: CategoryTypeEnum.GIFTS,
  charity: CategoryTypeEnum.GIFTS,
  donations: CategoryTypeEnum.GIFTS,

  // Uncategorized / other
  uncategorized: CategoryTypeEnum.OTHER,
  general: CategoryTypeEnum.OTHER,
  other: CategoryTypeEnum.OTHER,
  misc: CategoryTypeEnum.OTHER,
  miscellaneous: CategoryTypeEnum.OTHER,
};

// ============================================
// MAPPER
// ============================================

/**
 * Keys sorted longest-first so multi-word keys (e.g. "food and drink", "fast food")
 * are checked before their shorter substrings (e.g. "food").
 */
const SORTED_CATEGORY_KEYS = Object.keys(SPLITWISE_CATEGORY_MAP).sort((a, b) => b.length - a.length);

/**
 * Map a Splitwise category name to a local CategoryType.
 *
 * Matching is case-insensitive substring search — a description like
 * "Zomato food order" matches the "food" key.
 * Longer keys are checked first to prevent "food" matching before "fast food".
 * Returns CategoryTypeEnum.OTHER for unrecognised descriptions.
 */
export const mapSplitwiseCategoryToLocal = (splitwiseCategoryName: string): CategoryType => {
  const normalized = splitwiseCategoryName.trim().toLowerCase();
  const matchedKey = SORTED_CATEGORY_KEYS.find((key) => normalized.includes(key));
  return matchedKey ? (SPLITWISE_CATEGORY_MAP[matchedKey] as CategoryType) : CategoryTypeEnum.OTHER;
};
