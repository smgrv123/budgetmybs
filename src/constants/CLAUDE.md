# Constants

## File Types

- **`{feature}.strings.ts`** — All user-facing text for a feature: labels, placeholders, error messages, button text, descriptions. No hardcoded strings in components.
- **`{feature}.config.ts`** — Structural configuration: form field definitions, dropdown options, tab configurations, step definitions.
- **`asyncStorageKeys.ts`** — All AsyncStorage key constants. Never use raw string keys.

## Theme System (`src/constants/theme/`)

The theme is split across several files:

- `colors.ts` — Light/dark color palettes (`Colors.light`, `Colors.dark`)
- `variants.ts` — Variant enums (`ButtonVariant`, `TextVariant`, `CardVariant`, `SpacingValue`, `ComponentSize`, etc.)
- `layout.ts` — Dimensional constants (`Spacing`, `BorderRadius`, `IconSize`, `ComponentHeight`)
- `typography.ts` — Font sizes and weights
- `effects.ts` — Shadows and opacity

### Rules

- **Never use raw numbers for spacing, sizing, or border radius.** Always use `Spacing.base`, `BorderRadius.lg`, `IconSize.md`, etc.
- **Never reference `Colors.light` or `Colors.dark` directly in components.** Use the `useThemeColors()` hook.
- **Use variant constants** (`ButtonVariant.PRIMARY`, `TextVariant.BODY`) instead of string literals.
- If a value you need doesn't exist, **add it to the theme system** rather than hardcoding.
