import type { ChatIntent } from '@/db/types';
import type { ButtonVariantType } from '@/src/constants/theme';
import type { Category, CreditCard, Debt, FixedExpense, Income, Profile, SavingsGoal } from '@/db/schema-types';

// ============================================
// OPTION SOURCES
// ============================================

export type FormOption = {
  label: string;
  value: string;
};

/**
 * All option sources available to generic form fields, keyed by string.
 * Hooks call all data queries unconditionally; TanStack Query deduplication
 * makes extra calls free.
 */
export type FormOptionSources = {
  categories: FormOption[];
  creditCards: FormOption[];
  savingsGoals: FormOption[];
  /** Savings goals + an "Ad-hoc" sentinel option at the end (used by LOG_SAVINGS) */
  savingsGoalsWithAdhoc: FormOption[];
  incomeTypes: FormOption[];
  savingsTypes: FormOption[];
};

// ============================================
// CONTEXT PASSED TO transformData
// ============================================

/**
 * Rich context provided to each intent's transformData function.
 * All ID lookups (category, credit card, fixed expense, etc.) happen here.
 */
/** Minimal expense shape for registry lookups — compatible with both base Expense and the joined getExpensesWithCategory result */
export type ExpenseForRegistry = {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  category?: { id: string } | null;
};

export type RegistryContext = {
  profile: Profile | null;
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  categories: Category[];
  creditCards: CreditCard[];
  expenses?: ExpenseForRegistry[];
  incomeEntries?: Income[];
};

// ============================================
// FIELD DEFINITIONS
// ============================================

export type FieldType = 'text' | 'number' | 'picker' | 'date' | 'static';

export type FormFieldDef = {
  /** Unique key within the form; used as state key */
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  /** Required string key into FormOptionSources (for picker fields) */
  optionsSource?: keyof FormOptionSources;
  /** Modal title for picker fields */
  modalTitle?: string;
  /** Picker placeholder (used when no value selected) */
  pickerPlaceholder?: string;
  /** Whether this field is required for form submission */
  required?: boolean;
  /** Conditionally show this field when the given sibling field equals the given value */
  showIf?: {
    field: string;
    equals: string;
  };
};

// ============================================
// MUTATIONS
// ============================================

export type MutationStep = {
  /** String key into MutationMap (returned by useMutationMap) */
  key: string;
  /** Transforms form values + context into the args for the mutation */
  transformData: (formValues: Record<string, string>, context: RegistryContext) => unknown;
  /** Log message on error */
  errorLog: string;
};

// ============================================
// MESSAGES
// ============================================

export type IntentMessages = {
  success: string | ((formValues: Record<string, string>, context: RegistryContext) => string);
  failure: string;
  cancelled: string;
};

// ============================================
// REGISTRY ENTRY
// ============================================

export type IntentRegistryEntry = {
  intent: ChatIntent;
  title: string;
  formType: 'default' | 'deleteConfirm';
  buttonVariant: ButtonVariantType;
  submitLabel: string;
  fields: FormFieldDef[];
  /** Ordered array of mutations; handler runs them sequentially */
  mutations: MutationStep[];
  messages: IntentMessages;
  /** TanStack Query keys to invalidate on success */
  invalidations: readonly (readonly string[])[];
  /** Returns a map of fieldKey -> error message, or null if valid */
  validate: (formValues: Record<string, string>) => Record<string, string> | null;
  /** Initial values derived from AI-returned action data */
  getInitialValues: (actionData: Record<string, unknown>, context: RegistryContext) => Record<string, string>;
};

// ============================================
// MUTATION MAP
// ============================================

/**
 * All available async mutation functions keyed by string.
 * useMutationMap() builds this by calling all domain hooks unconditionally.
 */
export type MutationMap = Record<string, (args: any) => Promise<unknown>>;
