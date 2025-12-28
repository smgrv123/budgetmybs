import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

/**
 * Database client singleton
 * Initialized once and used by all queries
 */

const DATABASE_NAME = 'budgetmybs.db';

// Open the SQLite database
const expoDb = openDatabaseSync(DATABASE_NAME);

// Create the Drizzle instance with schema
export const db = drizzle(expoDb, { schema });

// Export the type for use in queries
export type DB = typeof db;
