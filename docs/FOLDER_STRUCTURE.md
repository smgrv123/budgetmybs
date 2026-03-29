# Folder Structure

## Overview

```
budgetmybs/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Entry — redirects to dashboard or onboarding
│   ├── dashboard/                # Dashboard screens
│   ├── onboarding/               # Onboarding flow screens
│   ├── settings/                 # Settings screens (fixed-expenses, debts, savings, credit-cards, income)
│   ├── transaction-detail.tsx    # Modal screen
│   └── all-transactions.tsx      # Modal screen
│
├── src/                          # Application source code
│   ├── components/
│   │   ├── ui/                   # B* primitives (BButton, BText, BView, etc.)
│   │   ├── {feature}/            # Feature-scoped components (transaction/, dashboard/, chat/)
│   │   ├── dashboard/            # Dashboard components (QuickActionsSection, QuickStatSheet, heroCard)
│   │   ├── income/               # Income components (IncomeForm)
│   │   ├── savings/              # Savings components (SavingsDepositForm, SavingsSummary, SavingsWithdrawalForm)
│   │   ├── {SharedName}.tsx      # Shared non-primitive components (used across features)
│   │   └── index.ts              # Barrel exports
│   │
│   ├── hooks/                    # TanStack Query hooks
│   │   ├── use{Domain}.ts        # One hook per domain (useExpenses, useProfile, useIncome, etc.)
│   │   ├── theme-hooks/          # Theme-related hooks
│   │   └── index.ts              # Barrel exports with query keys
│   │
│   ├── store/                    # Zustand stores (use sparingly)
│   │   ├── {name}Store.ts
│   │   └── index.ts
│   │
│   ├── services/                 # External API integrations only
│   │   ├── chatService.ts
│   │   ├── gemini.ts
│   │   └── financialPlanService.ts
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── income.ts             # IncomeEntryData type for income settings screen
│   │   ├── {domain}.ts
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── theme/                # Theme system (colors, spacing, variants, typography, layout)
│   │   ├── {feature}.strings.ts  # User-facing text
│   │   ├── dashboard.strings.ts  # Strings for dashboard Quick Actions section
│   │   ├── income.strings.ts     # Strings for income settings screen and income log form
│   │   ├── savings-deposit.strings.ts  # Strings for savings deposit form and summary
│   │   ├── {feature}.config.ts   # Structural configuration
│   │   └── asyncStorageKeys.ts   # AsyncStorage key constants
│   │
│   ├── validation/               # Zod schemas
│   │   ├── income.ts             # Zod schema for income log form
│   │   ├── savings-deposit.ts    # Zod schema for savings deposit form
│   │   ├── savings-withdrawal.ts # Zod schema for savings withdrawal form
│   │   └── {feature}.ts
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── budget.ts
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── network.ts
│   │   ├── normalize.ts
│   │   └── id.ts
│   │
│   └── config/
│       └── env.ts                # Environment configuration
│
├── db/                           # Database layer (Drizzle ORM + SQLite)
│   ├── schema.ts                 # Table definitions
│   ├── schema-types.ts           # Types derived from schema
│   ├── types.ts                  # Enums and display labels
│   ├── utils.ts                  # Date helpers, UUID generation
│   ├── client.ts                 # DB connection
│   ├── provider.tsx              # DatabaseProvider (runs migrations)
│   ├── seed.ts                   # Seed data (categories)
│   ├── queries/                  # One file per domain
│   │   ├── expenses.ts
│   │   ├── income.ts             # Income CRUD + monthly sum
│   │   ├── profile.ts
│   │   ├── categories.ts
│   │   └── ...
│   └── index.ts                  # Barrel exports
│
├── drizzle/                      # Generated migrations (do not edit manually)
├── assets/                       # Static assets (images, icons, Lottie animations)
└── docs/                         # Cross-cutting documentation
```

## Adding a New Feature (End-to-End Checklist)

Example: adding a "Wishlist" feature.

### 1. Database Layer (`db/`)

- Add table to `db/schema.ts` (follow existing table patterns — UUID PK, timestamps, `isActive` flag).
- Add types/enums to `db/types.ts` if needed (follow `as const` enum pattern).
- Add derived types to `db/schema-types.ts`.
- Create `db/queries/wishlist.ts` with CRUD functions.
- Export from `db/queries/index.ts` and `db/index.ts`.
- Run `npm run db:generate` to create migration.

### 2. Hook Layer (`src/hooks/`)

- Create `src/hooks/useWishlist.ts` following the TanStack Query pattern (see `src/hooks/CLAUDE.md`).
- Export hook and query keys from `src/hooks/index.ts`.

### 3. Types & Validation (`src/types/`, `src/validation/`)

- Add feature types to `src/types/wishlist.ts`, export from `src/types/index.ts`.
- Add Zod schemas to `src/validation/wishlist.ts`.

### 4. Constants (`src/constants/`)

- Create `src/constants/wishlist.strings.ts` for all user-facing text.
- Create `src/constants/wishlist.config.ts` for form configs, dropdown options, etc.

### 5. Components (`src/components/`)

- Create `src/components/wishlist/` directory for feature-specific components.
- Export from `src/components/index.ts`.
- Use B\* components internally, follow styling hierarchy (props → inline → StyleSheet).

### 6. Screens (`app/`)

- Add route files in the appropriate directory (e.g., `app/dashboard/wishlist.tsx`).
- Register in the relevant `_layout.tsx`.

### 7. Wire Up

- Hook into existing navigation (tabs, stack).
- Ensure barrel exports are updated in all `index.ts` files touched.
