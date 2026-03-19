# Coding Standards

## Naming Conventions

| Type          | Convention                          | Example                     |
| ------------- | ----------------------------------- | --------------------------- |
| Components    | PascalCase `.tsx`                   | `AddTransactionModal.tsx`   |
| UI primitives | kebab-case file, `B` prefix export  | `button.tsx` → `BButton`    |
| Hooks         | camelCase with `use` prefix         | `useExpenses.ts`            |
| Stores        | camelCase with `Store` suffix       | `onboardingStore.ts`        |
| Services      | camelCase with `Service` suffix     | `chatService.ts`            |
| Utils         | camelCase `.ts`                     | `budget.ts`, `date.ts`      |
| Types         | camelCase `.ts`                     | `transaction.ts`            |
| Strings       | `{feature}.strings.ts`              | `onboarding.strings.ts`     |
| Configs       | `{feature}.config.ts`               | `transactionForm.config.ts` |
| Validation    | `{feature}.ts` in `src/validation/` | `onboarding.ts`             |
| Query files   | domain-based `.ts` in `db/queries/` | `expenses.ts`, `profile.ts` |
| Route files   | kebab-case `.tsx` in `app/`         | `all-transactions.tsx`      |
| Layout files  | `_layout.tsx`                       | `app/dashboard/_layout.tsx` |

## Imports

- Always use the `@/*` alias — never relative paths across module boundaries.
- Import from barrel files where available:
  ```typescript
  import { BButton, BText } from '@/src/components';
  import { useExpenses, EXPENSES_QUERY_KEY } from '@/src/hooks';
  import { Spacing, TextVariant } from '@/src/constants/theme';
  ```
- Import types with `import type` when importing only types.

## Styling Hierarchy

When styling components, follow this order of preference:

1. **Built-in props on B\* components** — use `variant`, `size`, `spacing`, `radius` props first.
2. **Inline styles** — acceptable for 1-2 simple styles on a single element.
3. **StyleSheet** — use only when inline styles become unwieldy (3+ styles or reused across elements).

Never hardcode values:

```typescript
// BAD
{ padding: 16, borderRadius: 8, fontSize: 14 }

// GOOD
{ padding: Spacing.base, borderRadius: BorderRadius.base }
// BEST — use component props when available
<BView padding="base" radius="base">
```

## Theme & Colors

- Always use `useThemeColors()` hook — never reference `Colors.light` or `Colors.dark` directly.
- Use `Spacing`, `BorderRadius`, `IconSize`, `ComponentHeight` constants for all dimensional values.
- Use variant constants (`ButtonVariant`, `TextVariant`, `CardVariant`, etc.) for component variants.
- If a value doesn't exist in the theme, add it to the theme system rather than hardcoding.

## Strings & Configuration

- **`*.strings.ts`** — all user-facing text: labels, placeholders, error messages, button text.
- **`*.config.ts`** — structural configuration: form field definitions, dropdown options, tab layouts.
- Both live in `src/constants/`, named by feature.

## State Management

- **TanStack Query** — for all data that touches SQLite or external APIs (fetch, create, update, delete).
- **Zustand** — last resort, only for client-only UI state when no simpler alternative exists (e.g., multi-step onboarding flow). Do not reach for Zustand just because it's convenient.
- **Local `useState`** — for component-scoped state (form inputs, toggles, modals).

## Error Handling

- **Every mutation must have an error handler** — at minimum, log the error.
- **Zod validation errors** — display inline within the UI, allowing the user to fix before submission.
- **DB/network failures** — use `Alert.alert()` to warn the user that the action failed and they need to retry.
- **Network calls** — always call `ensureNetworkAvailable()` before external API requests.

## Validation

- All form validation uses Zod schemas in `src/validation/{feature}.ts`.
- Use `.safeParse()` — never `.parse()` (which throws).
- Validate before making any DB or API call.

## Type Safety

- No `as` typecasting unless absolutely necessary and documented with a comment explaining why.
- Prefer type inference over explicit annotations where TypeScript can infer correctly.
- Use the enum pattern from `db/types.ts` for union types:
  ```typescript
  export const MyEnum = {
    VALUE_A: 'value_a',
    VALUE_B: 'value_b',
  } as const;
  export type MyEnumType = (typeof MyEnum)[keyof typeof MyEnum];
  ```

## Date Handling

- Always use `dayjs` — never raw `Date`.
- Use helper functions from `db/utils.ts`: `getCurrentMonth()`, `formatDate()`, `getMonthFromDate()`, etc.
- Month format: `YYYY-MM`. Date format: `YYYY-MM-DD`.

## ID Generation

- DB layer: use `generateUUID()` from `db/utils.ts`.
- UI layer: use `expo-crypto` via `src/utils/id.ts`.
