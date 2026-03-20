# Hooks

All hooks use TanStack Query for data that touches SQLite or external APIs.

## File Convention

One file per domain: `use{Domain}.ts` (e.g., `useExpenses.ts`, `useProfile.ts`, `useDebts.ts`).

## Query Keys

Export query keys as `const` arrays from each hook file:

```typescript
export const EXPENSES_QUERY_KEY = ['expenses'] as const;
export const TOTAL_SPENT_QUERY_KEY = ['expenses', 'totalSpent'] as const;
```

Re-export from `src/hooks/index.ts` alongside the hook.

## Hook Structure

```typescript
export const use{Domain} = (params?) => {
  const queryClient = useQueryClient();

  // 1. Queries
  const mainQuery = useQuery({
    queryKey: [...DOMAIN_QUERY_KEY, { param }],
    queryFn: () => dbQueryFunction(param),
  });

  // 2. Mutations — every mutation MUST have an error handler
  const createMutation = useMutation({
    mutationFn: createFunction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    },
    // At minimum, log errors
    onError: (error) => {
      console.error('Failed to create:', error);
    },
  });

  // 3. Return — consistent naming pattern
  return {
    // Query data with safe defaults
    items: mainQuery.data ?? [],
    isItemsLoading: mainQuery.isLoading,
    isItemsError: mainQuery.isError,
    itemsError: mainQuery.error,
    refetchItems: mainQuery.refetch,

    // Mutation functions
    createItem: createMutation.mutate,
    createItemAsync: createMutation.mutateAsync,
    isCreatingItem: createMutation.isPending,
    createItemError: createMutation.error,
  };
};
```

## Return Value Naming

- Query data: descriptive name with safe default (`items: query.data ?? []`)
- Loading states: `is{Action}Loading` or `is{Action}Pending`
- Error states: `is{Action}Error`, `{action}Error`
- Mutations: verb form (`createItem`, `updateItem`, `removeItem`)
- Async variants: `{action}Async` (exposes `mutateAsync`)
- Refetch: `refetch{Items}`

## Invalidation

Always invalidate related query keys on mutation success. If creating an expense affects total spent, invalidate both:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
},
```

## Barrel Exports

Export every hook and its query keys from `src/hooks/index.ts`.
