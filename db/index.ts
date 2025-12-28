/**
 * Database Module Index
 * Central export for all database functionality
 */

// Database client
export { db } from "./client";
export type { DB } from "./client";

// Database provider (for migrations)
export { DatabaseProvider } from "./provider";

// Schema exports
export * from "./schema";

// Schema-derived types
export * from "./schema-types";

// Enum types
export * from "./types";

// Utility functions
export * from "./utils";

// Query exports
export * from "./queries";

// Seed function
export { forceReseedCategories, seedCategories } from "./seed";
