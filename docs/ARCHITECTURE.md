# Architecture

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Components │ ──▶ │  Hooks       │ ──▶ │  DB Queries   │ ──▶ │  SQLite  │
│  (app/, src │     │  (TanStack   │     │  (db/queries/) │     │          │
│  /components│     │   Query)     │     │               │     │          │
│  )          │ ◀── │              │ ◀── │               │ ◀── │          │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────┘
       │
       │ (external only)
       ▼
┌─────────────┐     ┌──────────────┐
│  Services   │ ──▶ │  External    │
│  (src/      │     │  APIs        │
│  services/) │ ◀── │  (Gemini)    │
└─────────────┘     └──────────────┘
```

## Layer Rules

| Layer             | Can Import From                                                          | Never Imports From                      |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| `app/` (screens)  | `src/components`, `src/hooks`, `src/constants`, `src/types`              | `db/queries` directly                   |
| `src/components/` | `src/hooks`, `src/constants`, `src/types`, `src/utils`, other components | `db/` directly                          |
| `src/hooks/`      | `db/`, `src/types`, `src/utils`, `src/services`                          | `src/components/`, `app/`               |
| `src/services/`   | `db/`, `src/types`, `src/utils`                                          | `src/components/`, `src/hooks/`, `app/` |
| `db/`             | Only `drizzle-orm`, its own modules                                      | `src/`, `app/`                          |

**The critical boundary:** Components and screens never import from `db/` directly. All data access goes through hooks.

## Provider Hierarchy

```tsx
// app/_layout.tsx
<GestureHandlerRootView>
  <DatabaseProvider>
    {' '}
    // Runs migrations, provides DB
    <QueryClientProvider>
      {' '}
      // TanStack Query cache
      <ThemeProvider>
        {' '}
        // Light/dark mode
        <Stack /> // Expo Router navigation
      </ThemeProvider>
    </QueryClientProvider>
  </DatabaseProvider>
</GestureHandlerRootView>
```

Order matters: Database must initialize before queries can run, which must be ready before themed UI renders.

## State Management Decision Tree

```
Does this data come from SQLite or an external API?
  ├─ YES → TanStack Query (via a hook in src/hooks/)
  └─ NO → Is it component-scoped UI state?
       ├─ YES → useState
       └─ NO → Is there a simpler alternative than Zustand?
            ├─ YES → Use the simpler alternative
            └─ NO → Zustand (src/store/)
```

Zustand is a last resort for complex client-only flows (e.g., multi-step onboarding) where the alternative would be unreasonably complex.

## AI Integration

The AI chat feature follows this flow:

1. Component (`chat.tsx`) captures user message
2. Hook (`useChat`) calls the service
3. Service (`chatService.ts`) calls `ensureNetworkAvailable()`, builds context from user data, sends to Gemini
4. Service (`gemini.ts`) handles the Generative AI SDK interaction
5. Response is a structured JSON (`ChatResponse`) with an `intent` + `data` + `message`
6. Hook processes the intent (creates expense, updates profile, etc.) via appropriate mutations
7. Chat message is saved to the DB

## Routing

Expo Router with file-based routing. Key patterns:

- `_layout.tsx` — defines navigation structure (Stack, Tabs)
- `index.tsx` — default route for a directory
- `[param].tsx` — dynamic routes
- Modal screens are registered at root level with `presentation: 'modal'`
- Root `index.tsx` checks if profile exists and redirects to `/dashboard` or `/onboarding/welcome`
