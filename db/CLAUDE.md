# Database Layer

Drizzle ORM with SQLite (expo-sqlite). All database logic lives in `db/`.

## Schema (`db/schema.ts`)

Every table follows this pattern:

```typescript
export const myTable = sqliteTable('my_table', {
  id: text('id')
    .primaryKey()
    .$default(() => generateUUID()),
  // ... columns
  isActive: integer('is_active').notNull().default(1), // Soft delete flag
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
```

Key conventions:

- UUID primary keys via `generateUUID()` from `db/utils.ts`.
- Column names use `snake_case` in SQL, Drizzle maps to `camelCase` in TypeScript.
- Soft deletes with `isActive` flag (integer 0/1, not boolean — SQLite limitation).
- Timestamps as `text` with `CURRENT_TIMESTAMP` default.

### Custom Types

When a column uses a custom TypeScript type (not a plain `text`/`integer`/`real`), it uses `.$type<T>()`:

```typescript
type: text('type').$type<FixedExpenseType>().notNull(),
```

All custom types are defined in `db/types.ts`. Always mention the custom type in the schema so it's clear what values are valid.

## Types (`db/types.ts`)

Enums follow the `as const` object pattern:

```typescript
export const MyTypeEnum = {
  VALUE_A: 'value_a',
  VALUE_B: 'value_b',
} as const;
export type MyType = (typeof MyTypeEnum)[keyof typeof MyTypeEnum];
export const MY_TYPES = Object.values(MyTypeEnum);
```

Also includes display labels for UI: `Record<MyType, string>`.

## Queries (`db/queries/`)

One file per domain (e.g., `expenses.ts`, `profile.ts`, `debts.ts`). Each file exports pure functions:

```typescript
export const getExpenses = async (month: string) => { ... };
export const createExpense = async (data: NewExpense) => { ... };
export const updateExpense = async (id: string, data: UpdateExpenseInput) => { ... };
export const deleteExpense = async (id: string) => { ... };
```

All query files are re-exported via `db/queries/index.ts` → `db/index.ts`.

## Migrations

After modifying `db/schema.ts`:

```bash
npm run db:generate
```

This generates migration files in `drizzle/`. **Never edit migration files manually.** Migrations run automatically on app startup via `DatabaseProvider`.

## UUID Generation

Use `generateUUID()` from `db/utils.ts` for all database IDs. This uses `crypto.randomUUID()` with a fallback to RFC 4122 v4.

## Date Helpers

All date utilities are in `db/utils.ts`. Always use these instead of raw dayjs calls in the DB layer:

- `getCurrentMonth()` → `YYYY-MM`
- `formatDate()` → `YYYY-MM-DD`
- `getMonthFromDate()`, `getFirstDayOfMonth()`, `getLastDayOfMonth()`
- `getPreviousMonth()`, `getNextMonth()`, `isCurrentMonth()`
- `getMonthName()`, `getShortMonthName()`
