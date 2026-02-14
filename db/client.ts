import { drizzle } from 'drizzle-orm/expo-sqlite';
import { deleteDatabaseSync, openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

/**
 * Database client singleton
 * Initialized once and used by all queries
 */

export const DATABASE_NAME = 'budgetmybs.db';

// Open the SQLite database
const expoDb = openDatabaseSync(DATABASE_NAME);

// Create the Drizzle instance with schema
export const db = drizzle(expoDb, { schema });

// Export the type for use in queries
export type DB = typeof db;

/**
 * Deletes the database file from the device.
 * Used for development reset.
 */
export const deleteDatabase = async () => {
  // Attempt to close connection if possible (though we don't have handle here easily without complicating init)
  // Try to delete file
  try {
    deleteDatabaseSync(DATABASE_NAME);
  } catch (e) {
    console.error('Delete database file failed', e);
  }

  // Fallback: Drop tables manually if file delete failed or connection held
  try {
    await expoDb.execAsync(`
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS debts;
            DROP TABLE IF EXISTS expenses;
            DROP TABLE IF EXISTS financial_plans;
            DROP TABLE IF EXISTS fixed_expenses;
            DROP TABLE IF EXISTS monthly_snapshots;
            DROP TABLE IF EXISTS profile;
            DROP TABLE IF EXISTS savings_goals;
            DROP TABLE IF EXISTS __drizzle_migrations;
        `);
  } catch (e) {
    console.error('Drop tables failed', e);
  }

  // Attempt to reset the internal journal of Drizzle?
  // Drizzle checks __drizzle_migrations table. If we drop it, it should re-run.
};
