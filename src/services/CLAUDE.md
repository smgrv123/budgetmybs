# Services

`src/services/` is exclusively for external API integrations. Internal utilities belong in `src/utils/`.

## Network Guard

Every service function that makes an external call must call `ensureNetworkAvailable()` before the request:

```typescript
import { ensureNetworkAvailable } from '@/src/utils/network';

export const myService = async (data: Input) => {
  await ensureNetworkAvailable();
  // ... make API call
};
```

This throws a `NetworkError` if the device is offline, allowing the UI to show an appropriate error.

## Current Services

- `gemini.ts` — Low-level wrapper around `@google/generative-ai` SDK. Provides `generateJSON<T>()` for structured responses.
- `chatService.ts` — Builds financial context, conversation history, and system prompt. Calls `gemini.ts`.
- `financialPlanService.ts` — Generates AI-powered financial plans during onboarding.

## Adding a New Service

1. Create `src/services/{name}Service.ts`.
2. Call `ensureNetworkAvailable()` at the start of every public function.
3. Handle errors — re-check network on failure to distinguish network drops from API errors.
4. Return typed responses — define response types in `src/types/`.
5. Consume from hooks, never from components directly.
