# Components

## B\* Components (UI Primitives)

All UI primitives live in `src/components/ui/` and are prefixed with `B`:
`BView`, `BText`, `BButton`, `BInput`, `BCard`, `BModal`, `BIcon`, `BDropdown`, `BDateField`, `BSwitch`, `BLink`, `BFAB`, `BAccordion`, `BToast`, `BSafeAreaView`.

**Always use B\* components instead of raw React Native primitives** (`View`, `Text`, `Pressable`, etc.). They have theme integration built in.

### When to create a new B\* component

- It wraps a React Native primitive or third-party primitive with theme integration.
- It is generic and reusable across any feature (not feature-specific).
- Examples: a B\* date picker, a B\* slider, a B\* chip.

### When NOT to create a B\* component

- It is feature-specific (e.g., `TransactionCard`, `BudgetSummary`) — these go in `src/components/{feature}/`.
- It combines multiple B\* components into a layout — this is a regular component.

## File Organization

- `src/components/ui/` — B\* primitives. File naming: kebab-case (e.g., `date-field.tsx`), export with `B` prefix.
- `src/components/{feature}/` — Feature-scoped components (e.g., `transaction/`, `dashboard/`, `chat/`). Only used within that feature's screens.
- `src/components/{Name}.tsx` — Shared non-primitive components used across multiple features. Flat at the components root, not in a feature folder.

## Component Structure

```typescript
import type { FC } from 'react';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

const MyComponent: FC<MyComponentProps> = ({ title, onPress }) => {
  const themeColors = useThemeColors();

  return (
    <BView padding="base">
      <BText variant={TextVariant.BODY}>{title}</BText>
      <BButton variant={ButtonVariant.PRIMARY} onPress={onPress}>Save</BButton>
    </BView>
  );
};

export default MyComponent;
```

## Styling Rules

Order of preference:

1. **B\* component props** — `variant`, `size`, `padding`, `radius`, etc. Always prefer these.
2. **Inline style** — only for 1-2 styles on a single element that can't be achieved via props.
3. **StyleSheet** — only when inline styles become unwieldy.

Never hardcode numbers or color strings — always use theme constants (`Spacing`, `BorderRadius`, `Colors` via `useThemeColors()`).

## Barrel Exports

Every new component must be exported from `src/components/index.ts`. UI primitives also export their prop types.
