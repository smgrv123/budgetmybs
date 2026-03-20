# BudgetMyBS

React Native (Expo) personal budgeting app with AI-powered financial advice. SQLite local database, no backend server.

## Commands

```bash
npx expo start --ios          # Run on iOS simulator
npx expo start --android      # Run on Android emulator
npm run lint                  # ESLint + Expo lint
npm run lint:fix              # Auto-fix lint issues
npm run typecheck             # TypeScript type check (tsc --noEmit)
npm run format                # Prettier format all files
npm run db:generate           # Generate Drizzle migration after schema changes
```

## Key Rules

- **Import alias:** `@/*` maps to the project root. Always use `@/src/...`, `@/db/...`, etc.
- **Use B\* components:** Always use `BView`, `BText`, `BButton`, `BInput`, etc. from `@/src/components` instead of raw React Native primitives.
- **No raw style values:** Use `Spacing`, `BorderRadius`, `IconSize`, `ComponentHeight` from `@/src/constants/theme` — never hardcode pixel numbers or color strings.
- **No hardcoded user-facing strings:** All display text goes in `src/constants/{feature}.strings.ts`.
- **No typecasting:** Avoid `as` assertions unless absolutely necessary — in both UI and DB code.
- **dayjs for all dates:** Never use raw `Date`. Use `dayjs` and the helpers in `db/utils.ts`.
- **Barrel exports:** New files in `src/components/`, `src/hooks/`, `src/store/`, `src/types/` must be re-exported from that directory's `index.ts`.

## Cross-Cutting Docs

Read these **only when the scope of work requires it** — not for small bug fixes or single-line changes.

- `docs/FOLDER_STRUCTURE.md` — MUST read before creating, moving, or deleting files.
- `docs/CODING_STANDARDS.md` — MUST read when writing new components, hooks, or modules. Not needed for small fixes to existing code.
- `docs/ARCHITECTURE.md` — MUST read when adding new data flows, layers, or integrations.

## Maintenance

When files are added, deleted, or moved, update `docs/FOLDER_STRUCTURE.md` to reflect the change.
