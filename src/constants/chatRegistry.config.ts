/**
 * Intent Registry — single source of truth for all registry-based chat intents.
 *
 * Each entry is a declarative config object. The generic form + action handler
 * read from here; no per-intent logic lives outside this file.
 */
import {
  ChatIntentEnum,
  CreditCardTxnTypeEnum,
  DebtTypeEnum,
  FixedExpenseTypeEnum,
  IncomeTypeEnum,
  SAVINGS_TYPES,
  SavingsTypeEnum,
  USER_INCOME_TYPES,
} from '@/db/types';
import { formatDate as formatDbDate } from '@/db/utils';
import { DEBTS_QUERY_KEY } from '@/src/hooks/useDebts';
import { EXPENSES_QUERY_KEY } from '@/src/hooks/queryKeys';
import { FIXED_EXPENSES_QUERY_KEY } from '@/src/hooks/useFixedExpenses';
import { INCOME_QUERY_KEY, MONTHLY_INCOME_SUM_QUERY_KEY } from '@/src/hooks/useIncome';
import { PROFILE_QUERY_KEY } from '@/src/hooks/useProfile';
import {
  ADHOC_SAVINGS_BALANCES_QUERY_KEY,
  MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
  SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
  SAVINGS_GOALS_QUERY_KEY,
} from '@/src/hooks/useSavingsGoals';
import { isISODateString } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/format';
import type { IntentRegistryEntry } from '@/src/types/chatRegistry';
import { CHAT_REGISTRY_STRINGS } from './chat.registry.strings';
import { CHAT_PROFILE_FIELD_LABELS } from './chat';
import { ButtonVariant } from './theme';
import dayjs from 'dayjs';
import { z } from 'zod';

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Wraps a Zod schema into the validate function signature expected by IntentRegistryEntry.
 * Form values are always Record<string, string>; z.coerce handles type coercion per field.
 */
const validateWithSchema =
  (schema: z.ZodTypeAny) =>
  (formValues: Record<string, string>): Record<string, string> | null => {
    const result = schema.safeParse(formValues);
    if (result.success) return null;
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const mapped: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (msgs && msgs.length > 0) mapped[key] = msgs[0]!;
    }
    return Object.keys(mapped).length > 0 ? mapped : null;
  };

// ============================================
// FIELD KEY CONSTANTS
// ============================================

export const ExpenseFieldKey = {
  AMOUNT: 'amount',
  CATEGORY_ID: 'categoryId',
  CREDIT_CARD_ID: 'creditCardId',
  DESCRIPTION: 'description',
} as const;

export const IncomeFieldKey = {
  AMOUNT: 'amount',
  TYPE: 'type',
  CUSTOM_TYPE: 'customType',
  DESCRIPTION: 'description',
  DATE: 'date',
} as const;

export const DeleteFixedExpenseFieldKey = {
  EXISTING_NAME: 'existingName',
} as const;

export const ProfileUpdateFieldKey = {
  FIELD_LABEL: '_fieldLabel',
  VALUE: 'value',
} as const;

export const FixedExpenseRegistryFieldKey = {
  NAME: 'name',
  AMOUNT: 'amount',
  EXISTING_NAME: 'existingName',
  // hidden key to carry the type from AI actionData
  TYPE: '_type',
} as const;

export const DebtRegistryFieldKey = {
  NAME: 'name',
  PRINCIPAL: 'principal',
  INTEREST_RATE: 'interestRate',
  EMI_AMOUNT: 'emiAmount',
  TENURE_MONTHS: 'tenureMonths',
  EXISTING_NAME: 'existingName',
  // hidden key to carry the type from AI actionData
  TYPE: '_type',
} as const;

export const DeleteDebtFieldKey = {
  EXISTING_NAME: 'existingName',
} as const;

export const SavingsGoalRegistryFieldKey = {
  NAME: 'name',
  TARGET_AMOUNT: 'targetAmount',
  EXISTING_NAME: 'existingName',
  // hidden key to carry the type from AI actionData
  TYPE: '_type',
} as const;

export const DeleteSavingsGoalFieldKey = {
  EXISTING_NAME: 'existingName',
} as const;

// Ad-hoc sentinel value for LOG_SAVINGS destination picker
const ADHOC_VALUE = '__adhoc__';

export const LogSavingsFieldKey = {
  AMOUNT: 'amount',
  DESTINATION: 'destination',
  SAVINGS_TYPE: 'savingsType',
  DESCRIPTION: 'description',
} as const;

export const WithdrawSavingsFieldKey = {
  SOURCE_LABEL: 'sourceLabel',
  AVAILABLE_BALANCE: 'availableBalance',
  AMOUNT: 'amount',
  REASON: 'reason',
  // hidden keys to carry IDs
  SAVINGS_GOAL_ID: '_savingsGoalId',
  SAVINGS_TYPE: '_savingsType',
} as const;

// ============================================
// REGISTRY ENTRIES
// ============================================

const addExpenseEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.ADD_EXPENSE,
  title: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_SUBMIT,

  fields: [
    {
      key: ExpenseFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_AMOUNT_PLACEHOLDER,
      required: true,
    },
    {
      key: ExpenseFieldKey.CATEGORY_ID,
      type: 'picker',
      label: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CATEGORY_LABEL,
      optionsSource: 'categories',
      modalTitle: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CATEGORY_MODAL_TITLE,
      required: true,
    },
    {
      key: ExpenseFieldKey.CREDIT_CARD_ID,
      type: 'picker',
      label: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CREDIT_CARD_LABEL,
      optionsSource: 'creditCards',
      modalTitle: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CREDIT_CARD_MODAL_TITLE,
      pickerPlaceholder: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CREDIT_CARD_PLACEHOLDER,
      required: false,
    },
    {
      key: ExpenseFieldKey.DESCRIPTION,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_DESCRIPTION_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_DESCRIPTION_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    {
      key: 'createExpense',
      transformData: (formValues, _context) => ({
        amount: parseFloat(formValues[ExpenseFieldKey.AMOUNT] ?? '0'),
        categoryId: formValues[ExpenseFieldKey.CATEGORY_ID] || undefined,
        description: formValues[ExpenseFieldKey.DESCRIPTION] || undefined,
        wasImpulse: 0,
        ...(formValues[ExpenseFieldKey.CREDIT_CARD_ID]
          ? {
              creditCardId: formValues[ExpenseFieldKey.CREDIT_CARD_ID],
              creditCardTxnType: CreditCardTxnTypeEnum.PURCHASE,
            }
          : {}),
      }),
      errorLog: 'Failed to save expense:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.ADD_EXPENSE_SUCCESS(parseFloat(formValues[ExpenseFieldKey.AMOUNT] ?? '0')),
    failure: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.ADD_EXPENSE_CANCELLED,
  },

  invalidations: [EXPENSES_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [ExpenseFieldKey.AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED }),
      [ExpenseFieldKey.CATEGORY_ID]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_CATEGORY_REQUIRED }),
    }).loose()
  ),

  getInitialValues: (actionData, context) => {
    // Resolve AI-returned category name to its DB id
    const categoryName = typeof actionData['category'] === 'string' ? actionData['category'] : '';
    const matchedCategory = context.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());

    // Resolve AI-returned credit card nickname to its DB id
    const creditCardNickname = typeof actionData['creditCard'] === 'string' ? actionData['creditCard'] : '';
    const matchedCard = creditCardNickname
      ? context.creditCards.find((c) => c.nickname.toLowerCase() === creditCardNickname.toLowerCase())
      : undefined;

    return {
      [ExpenseFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
      [ExpenseFieldKey.CATEGORY_ID]: matchedCategory?.id ?? '',
      [ExpenseFieldKey.CREDIT_CARD_ID]: matchedCard?.id ?? '',
      [ExpenseFieldKey.DESCRIPTION]: typeof actionData['description'] === 'string' ? actionData['description'] : '',
    };
  },
};

const addIncomeEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.ADD_INCOME,
  title: CHAT_REGISTRY_STRINGS.ADD_INCOME_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.ADD_INCOME_SUBMIT,

  fields: [
    {
      key: IncomeFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_INCOME_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_INCOME_AMOUNT_PLACEHOLDER,
      required: true,
    },
    {
      key: IncomeFieldKey.TYPE,
      type: 'picker',
      label: CHAT_REGISTRY_STRINGS.ADD_INCOME_TYPE_LABEL,
      optionsSource: 'incomeTypes',
      modalTitle: CHAT_REGISTRY_STRINGS.ADD_INCOME_TYPE_MODAL_TITLE,
      required: true,
    },
    {
      key: IncomeFieldKey.CUSTOM_TYPE,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_INCOME_CUSTOM_TYPE_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_INCOME_CUSTOM_TYPE_PLACEHOLDER,
      required: false,
      showIf: { field: IncomeFieldKey.TYPE, equals: IncomeTypeEnum.OTHER },
    },
    {
      key: IncomeFieldKey.DESCRIPTION,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_INCOME_DESCRIPTION_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_INCOME_DESCRIPTION_PLACEHOLDER,
      required: false,
    },
    {
      key: IncomeFieldKey.DATE,
      type: 'date',
      label: CHAT_REGISTRY_STRINGS.ADD_INCOME_DATE_LABEL,
      required: true,
    },
  ],

  mutations: [
    {
      key: 'createIncome',
      transformData: (formValues, _context) => ({
        amount: parseFloat(formValues[IncomeFieldKey.AMOUNT] ?? '0'),
        type: formValues[IncomeFieldKey.TYPE],
        customType:
          formValues[IncomeFieldKey.TYPE] === IncomeTypeEnum.OTHER
            ? (formValues[IncomeFieldKey.CUSTOM_TYPE]?.trim() ?? null)
            : null,
        description: formValues[IncomeFieldKey.DESCRIPTION]?.trim() || undefined,
        date: formValues[IncomeFieldKey.DATE],
      }),
      errorLog: 'Failed to add income entry:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.ADD_INCOME_SUCCESS(parseFloat(formValues[IncomeFieldKey.AMOUNT] ?? '0')),
    failure: CHAT_REGISTRY_STRINGS.ADD_INCOME_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.ADD_INCOME_CANCELLED,
  },

  invalidations: [INCOME_QUERY_KEY, MONTHLY_INCOME_SUM_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [IncomeFieldKey.AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED }),
      [IncomeFieldKey.TYPE]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_INCOME_TYPE_REQUIRED }),
      [IncomeFieldKey.CUSTOM_TYPE]: z.string().optional(),
      [IncomeFieldKey.DATE]: z.string().refine(isISODateString, { message: CHAT_REGISTRY_STRINGS.VALIDATION_DATE_REQUIRED }),
    })
    .loose()
    .refine(
      (data) => data[IncomeFieldKey.TYPE] !== IncomeTypeEnum.OTHER || !!data[IncomeFieldKey.CUSTOM_TYPE]?.trim(),
      { message: CHAT_REGISTRY_STRINGS.VALIDATION_CUSTOM_TYPE_REQUIRED, path: [IncomeFieldKey.CUSTOM_TYPE] }
    )
  ),

  getInitialValues: (actionData, _context) => {
    // Resolve AI-returned income type; fall back to first user type
    const rawType = typeof actionData['type'] === 'string' ? actionData['type'] : '';
    const resolvedType = (USER_INCOME_TYPES as readonly string[]).includes(rawType)
      ? rawType
      : (USER_INCOME_TYPES[0] ?? '');

    // Resolve date; fall back to today
    const rawDate = typeof actionData['date'] === 'string' ? actionData['date'] : '';
    const resolvedDate = isISODateString(rawDate) ? rawDate : formatDbDate(dayjs().toDate());

    return {
      [IncomeFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
      [IncomeFieldKey.TYPE]: resolvedType,
      [IncomeFieldKey.CUSTOM_TYPE]: typeof actionData['customType'] === 'string' ? actionData['customType'] : '',
      [IncomeFieldKey.DESCRIPTION]: typeof actionData['description'] === 'string' ? actionData['description'] : '',
      [IncomeFieldKey.DATE]: resolvedDate,
    };
  },
};

const deleteFixedExpenseEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.DELETE_FIXED_EXPENSE,
  title: CHAT_REGISTRY_STRINGS.DELETE_FIXED_EXPENSE_TITLE,
  formType: 'deleteConfirm',
  buttonVariant: ButtonVariant.DANGER,
  submitLabel: CHAT_REGISTRY_STRINGS.DELETE_FIXED_EXPENSE_SUBMIT,

  fields: [
    {
      key: DeleteFixedExpenseFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Name',
      required: true,
    },
  ],

  mutations: [
    {
      key: 'removeFixedExpense',
      transformData: (formValues, context) => {
        const name = formValues[DeleteFixedExpenseFieldKey.EXISTING_NAME] ?? '';
        const match = context.fixedExpenses.find((fe) => fe.name === name);
        // Return the id string; useMutationMap's removeFixedExpense expects a string id
        return match?.id ?? '';
      },
      errorLog: 'Failed to delete fixed expense:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.DELETE_FIXED_EXPENSE_SUCCESS(formValues[DeleteFixedExpenseFieldKey.EXISTING_NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.DELETE_FIXED_EXPENSE_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.DELETE_FIXED_EXPENSE_CANCELLED,
  },

  invalidations: [FIXED_EXPENSES_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [DeleteFixedExpenseFieldKey.EXISTING_NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_ITEM_NOT_FOUND('') }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [DeleteFixedExpenseFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
  }),
};

// ============================================
// UPDATE_PROFILE
// ============================================

const updateProfileEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.UPDATE_PROFILE,
  title: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_SUBMIT,

  fields: [
    {
      key: ProfileUpdateFieldKey.FIELD_LABEL,
      type: 'static',
      label: 'Field',
      required: false,
    },
    {
      key: ProfileUpdateFieldKey.VALUE,
      type: 'number',
      label: 'Value (₹)',
      placeholder: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_VALUE_PLACEHOLDER,
      required: true,
    },
  ],

  mutations: [
    {
      key: 'upsertProfile',
      transformData: (formValues, context) => {
        const fieldKey = formValues['_field'] ?? '';
        const value = parseFloat(formValues[ProfileUpdateFieldKey.VALUE] ?? '0');
        const profile = context.profile;
        if (!profile || !fieldKey) return null;
        return {
          name: profile.name,
          salary: profile.salary,
          monthlySavingsTarget: profile.monthlySavingsTarget,
          frivolousBudget: profile.frivolousBudget,
          debtPayoffPreference: profile.debtPayoffPreference,
          [fieldKey]: value,
        };
      },
      errorLog: 'Failed to update profile:',
    },
  ],

  messages: {
    success: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_SUCCESS,
    failure: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.UPDATE_PROFILE_CANCELLED,
  },

  invalidations: [PROFILE_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [ProfileUpdateFieldKey.VALUE]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_VALUE_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_VALUE_REQUIRED }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => {
    const fieldKey = typeof actionData['field'] === 'string' ? actionData['field'] : '';
    const fieldLabel = CHAT_PROFILE_FIELD_LABELS[fieldKey] ?? fieldKey;
    return {
      [ProfileUpdateFieldKey.FIELD_LABEL]: fieldLabel,
      [ProfileUpdateFieldKey.VALUE]: String(actionData['value'] ?? ''),
      // hidden key to carry the field name for transformData
      _field: fieldKey,
    };
  },
};

// ============================================
// ADD_FIXED_EXPENSE / UPDATE_FIXED_EXPENSE
// ============================================

const addFixedExpenseEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.ADD_FIXED_EXPENSE,
  title: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_SUBMIT,

  fields: [
    {
      key: FixedExpenseRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_NAME_PLACEHOLDER,
      required: true,
    },
    {
      key: FixedExpenseRegistryFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_AMOUNT_PLACEHOLDER,
      required: true,
    },
  ],

  mutations: [
    {
      key: 'createFixedExpense',
      transformData: (formValues, _context) => ({
        name: formValues[FixedExpenseRegistryFieldKey.NAME] ?? '',
        type: formValues[FixedExpenseRegistryFieldKey.TYPE] ?? FixedExpenseTypeEnum.OTHER,
        amount: parseFloat(formValues[FixedExpenseRegistryFieldKey.AMOUNT] ?? '0'),
      }),
      errorLog: 'Failed to add fixed expense:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_SUCCESS(formValues[FixedExpenseRegistryFieldKey.NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_CANCELLED,
  },

  invalidations: [FIXED_EXPENSES_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [FixedExpenseRegistryFieldKey.NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_NAME_REQUIRED }),
      [FixedExpenseRegistryFieldKey.AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [FixedExpenseRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [FixedExpenseRegistryFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
    // hidden key to carry AI-determined type
    [FixedExpenseRegistryFieldKey.TYPE]:
      typeof actionData['type'] === 'string' ? actionData['type'] : FixedExpenseTypeEnum.OTHER,
  }),
};

const updateFixedExpenseEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.UPDATE_FIXED_EXPENSE,
  title: CHAT_REGISTRY_STRINGS.UPDATE_FIXED_EXPENSE_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.UPDATE_FIXED_EXPENSE_SUBMIT,

  fields: [
    {
      key: FixedExpenseRegistryFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Updating',
      required: false,
    },
    {
      key: FixedExpenseRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_NAME_PLACEHOLDER,
      required: false,
    },
    {
      key: FixedExpenseRegistryFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_FIXED_EXPENSE_AMOUNT_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    {
      key: 'updateFixedExpense',
      transformData: (formValues, context) => {
        const existingName = formValues[FixedExpenseRegistryFieldKey.EXISTING_NAME] ?? '';
        const match = context.fixedExpenses.find((fe) => fe.name === existingName);
        if (!match) return null;
        const data: Record<string, unknown> = {};
        if (formValues[FixedExpenseRegistryFieldKey.NAME]?.trim()) {
          data['name'] = formValues[FixedExpenseRegistryFieldKey.NAME];
        }
        if (formValues[FixedExpenseRegistryFieldKey.AMOUNT]) {
          const parsed = parseFloat(formValues[FixedExpenseRegistryFieldKey.AMOUNT]);
          if (!isNaN(parsed) && parsed > 0) data['amount'] = parsed;
        }
        return { id: match.id, data };
      },
      errorLog: 'Failed to update fixed expense:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.UPDATE_FIXED_EXPENSE_SUCCESS(
        formValues[FixedExpenseRegistryFieldKey.NAME] || formValues[FixedExpenseRegistryFieldKey.EXISTING_NAME] || ''
      ),
    failure: CHAT_REGISTRY_STRINGS.UPDATE_FIXED_EXPENSE_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.UPDATE_FIXED_EXPENSE_CANCELLED,
  },

  invalidations: [FIXED_EXPENSES_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [FixedExpenseRegistryFieldKey.NAME]: z.string().optional(),
      [FixedExpenseRegistryFieldKey.AMOUNT]: z.string().optional(),
    })
    .loose()
    .superRefine((data, ctx) => {
      const hasName = !!data[FixedExpenseRegistryFieldKey.NAME]?.trim();
      const amount = parseFloat(data[FixedExpenseRegistryFieldKey.AMOUNT] ?? '');
      const hasAmount = !isNaN(amount) && amount > 0;
      if (!hasName && !hasAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: CHAT_REGISTRY_STRINGS.VALIDATION_NAME_REQUIRED, path: [FixedExpenseRegistryFieldKey.NAME] });
      }
    })
  ),

  getInitialValues: (actionData, _context) => ({
    [FixedExpenseRegistryFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
    [FixedExpenseRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [FixedExpenseRegistryFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
  }),
};

// ============================================
// ADD_DEBT / UPDATE_DEBT / DELETE_DEBT
// ============================================

const addDebtEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.ADD_DEBT,
  title: CHAT_REGISTRY_STRINGS.ADD_DEBT_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.ADD_DEBT_SUBMIT,

  fields: [
    {
      key: DebtRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_NAME_PLACEHOLDER,
      required: true,
    },
    {
      key: DebtRegistryFieldKey.PRINCIPAL,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_PRINCIPAL_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_PRINCIPAL_PLACEHOLDER,
      required: true,
    },
    {
      key: DebtRegistryFieldKey.INTEREST_RATE,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_INTEREST_RATE_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_INTEREST_RATE_PLACEHOLDER,
      required: true,
    },
    {
      key: DebtRegistryFieldKey.EMI_AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_EMI_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_EMI_PLACEHOLDER,
      required: true,
    },
    {
      key: DebtRegistryFieldKey.TENURE_MONTHS,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_TENURE_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_TENURE_PLACEHOLDER,
      required: true,
    },
  ],

  mutations: [
    {
      key: 'createDebt',
      transformData: (formValues, _context) => {
        const principal = parseFloat(formValues[DebtRegistryFieldKey.PRINCIPAL] ?? '0');
        const tenureMonths = parseInt(formValues[DebtRegistryFieldKey.TENURE_MONTHS] ?? '0', 10);
        return {
          name: formValues[DebtRegistryFieldKey.NAME] ?? '',
          type: formValues[DebtRegistryFieldKey.TYPE] ?? DebtTypeEnum.OTHER,
          principal,
          interestRate: parseFloat(formValues[DebtRegistryFieldKey.INTEREST_RATE] ?? '0'),
          emiAmount: parseFloat(formValues[DebtRegistryFieldKey.EMI_AMOUNT] ?? '0'),
          tenureMonths,
          remaining: principal,
          remainingMonths: tenureMonths,
          customType: null,
          startDate: null,
        };
      },
      errorLog: 'Failed to add debt:',
    },
  ],

  messages: {
    success: (formValues) => CHAT_REGISTRY_STRINGS.ADD_DEBT_SUCCESS(formValues[DebtRegistryFieldKey.NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.ADD_DEBT_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.ADD_DEBT_CANCELLED,
  },

  invalidations: [DEBTS_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [DebtRegistryFieldKey.NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_NAME_REQUIRED }),
      [DebtRegistryFieldKey.PRINCIPAL]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_PRINCIPAL_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_PRINCIPAL_REQUIRED }),
      [DebtRegistryFieldKey.INTEREST_RATE]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_INTEREST_RATE_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_INTEREST_RATE_REQUIRED }),
      [DebtRegistryFieldKey.EMI_AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_EMI_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_EMI_REQUIRED }),
      [DebtRegistryFieldKey.TENURE_MONTHS]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_TENURE_REQUIRED })
        .int()
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_TENURE_REQUIRED }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [DebtRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [DebtRegistryFieldKey.PRINCIPAL]: String(actionData['principal'] ?? ''),
    [DebtRegistryFieldKey.INTEREST_RATE]: String(actionData['interestRate'] ?? ''),
    [DebtRegistryFieldKey.EMI_AMOUNT]: String(actionData['emiAmount'] ?? ''),
    [DebtRegistryFieldKey.TENURE_MONTHS]: String(actionData['tenureMonths'] ?? ''),
    // hidden key to carry AI-determined debt type
    [DebtRegistryFieldKey.TYPE]: typeof actionData['type'] === 'string' ? actionData['type'] : 'other',
  }),
};

const updateDebtEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.UPDATE_DEBT,
  title: CHAT_REGISTRY_STRINGS.UPDATE_DEBT_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.UPDATE_DEBT_SUBMIT,

  fields: [
    {
      key: DebtRegistryFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Updating',
      required: false,
    },
    {
      key: DebtRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_NAME_PLACEHOLDER,
      required: false,
    },
    {
      key: DebtRegistryFieldKey.PRINCIPAL,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_PRINCIPAL_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_PRINCIPAL_PLACEHOLDER,
      required: false,
    },
    {
      key: DebtRegistryFieldKey.INTEREST_RATE,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_INTEREST_RATE_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_INTEREST_RATE_PLACEHOLDER,
      required: false,
    },
    {
      key: DebtRegistryFieldKey.EMI_AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_EMI_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_EMI_PLACEHOLDER,
      required: false,
    },
    {
      key: DebtRegistryFieldKey.TENURE_MONTHS,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_DEBT_TENURE_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_DEBT_TENURE_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    {
      key: 'updateDebt',
      transformData: (formValues, context) => {
        const existingName = formValues[DebtRegistryFieldKey.EXISTING_NAME] ?? '';
        const match = context.debts.find((d) => d.name === existingName);
        if (!match) return null;
        const data: Record<string, unknown> = {};
        if (formValues[DebtRegistryFieldKey.NAME]?.trim()) {
          data['name'] = formValues[DebtRegistryFieldKey.NAME];
        }
        if (formValues[DebtRegistryFieldKey.PRINCIPAL]) {
          const v = parseFloat(formValues[DebtRegistryFieldKey.PRINCIPAL]);
          if (!isNaN(v) && v > 0) data['principal'] = v;
        }
        if (formValues[DebtRegistryFieldKey.INTEREST_RATE]) {
          const v = parseFloat(formValues[DebtRegistryFieldKey.INTEREST_RATE]);
          if (!isNaN(v) && v > 0) data['interestRate'] = v;
        }
        if (formValues[DebtRegistryFieldKey.EMI_AMOUNT]) {
          const v = parseFloat(formValues[DebtRegistryFieldKey.EMI_AMOUNT]);
          if (!isNaN(v) && v > 0) data['emiAmount'] = v;
        }
        if (formValues[DebtRegistryFieldKey.TENURE_MONTHS]) {
          const v = parseInt(formValues[DebtRegistryFieldKey.TENURE_MONTHS], 10);
          if (!isNaN(v) && v > 0) data['tenureMonths'] = v;
        }
        return { id: match.id, data };
      },
      errorLog: 'Failed to update debt:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.UPDATE_DEBT_SUCCESS(
        formValues[DebtRegistryFieldKey.NAME] || formValues[DebtRegistryFieldKey.EXISTING_NAME] || ''
      ),
    failure: CHAT_REGISTRY_STRINGS.UPDATE_DEBT_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.UPDATE_DEBT_CANCELLED,
  },

  invalidations: [DEBTS_QUERY_KEY],

  validate: validateWithSchema(z.object({}).loose()),

  getInitialValues: (actionData, _context) => ({
    [DebtRegistryFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
    [DebtRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [DebtRegistryFieldKey.PRINCIPAL]: String(actionData['principal'] ?? ''),
    [DebtRegistryFieldKey.INTEREST_RATE]: String(actionData['interestRate'] ?? ''),
    [DebtRegistryFieldKey.EMI_AMOUNT]: String(actionData['emiAmount'] ?? ''),
    [DebtRegistryFieldKey.TENURE_MONTHS]: String(actionData['tenureMonths'] ?? ''),
  }),
};

const deleteDebtEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.DELETE_DEBT,
  title: CHAT_REGISTRY_STRINGS.DELETE_DEBT_TITLE,
  formType: 'deleteConfirm',
  buttonVariant: ButtonVariant.DANGER,
  submitLabel: CHAT_REGISTRY_STRINGS.DELETE_DEBT_SUBMIT,

  fields: [
    {
      key: DeleteDebtFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Name',
      required: true,
    },
  ],

  mutations: [
    {
      key: 'removeDebt',
      transformData: (formValues, context) => {
        const name = formValues[DeleteDebtFieldKey.EXISTING_NAME] ?? '';
        const match = context.debts.find((d) => d.name === name);
        return match?.id ?? '';
      },
      errorLog: 'Failed to delete debt:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.DELETE_DEBT_SUCCESS(formValues[DeleteDebtFieldKey.EXISTING_NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.DELETE_DEBT_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.DELETE_DEBT_CANCELLED,
  },

  invalidations: [DEBTS_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [DeleteDebtFieldKey.EXISTING_NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_ITEM_NOT_FOUND('') }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [DeleteDebtFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
  }),
};

// ============================================
// ADD_MONTHLY_SAVINGS / UPDATE_MONTHLY_SAVINGS / DELETE_MONTHLY_SAVINGS
// ============================================

const addMonthlySavingsEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.ADD_MONTHLY_SAVINGS,
  title: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_SUBMIT,

  fields: [
    {
      key: SavingsGoalRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_NAME_PLACEHOLDER,
      required: true,
    },
    {
      key: SavingsGoalRegistryFieldKey.TARGET_AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_TARGET_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_TARGET_PLACEHOLDER,
      required: true,
    },
  ],

  mutations: [
    {
      key: 'createSavingsGoal',
      transformData: (formValues, _context) => ({
        name: formValues[SavingsGoalRegistryFieldKey.NAME] ?? '',
        type: formValues[SavingsGoalRegistryFieldKey.TYPE] ?? SavingsTypeEnum.OTHER,
        targetAmount: parseFloat(formValues[SavingsGoalRegistryFieldKey.TARGET_AMOUNT] ?? '0'),
      }),
      errorLog: 'Failed to add savings goal:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_SUCCESS(formValues[SavingsGoalRegistryFieldKey.NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_CANCELLED,
  },

  invalidations: [SAVINGS_GOALS_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [SavingsGoalRegistryFieldKey.NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_NAME_REQUIRED }),
      [SavingsGoalRegistryFieldKey.TARGET_AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_TARGET_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_TARGET_REQUIRED }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [SavingsGoalRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [SavingsGoalRegistryFieldKey.TARGET_AMOUNT]: String(actionData['targetAmount'] ?? ''),
    // hidden key to carry AI-determined savings type
    [SavingsGoalRegistryFieldKey.TYPE]:
      typeof actionData['type'] === 'string' ? actionData['type'] : SavingsTypeEnum.OTHER,
  }),
};

const updateMonthlySavingsEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.UPDATE_MONTHLY_SAVINGS,
  title: CHAT_REGISTRY_STRINGS.UPDATE_MONTHLY_SAVINGS_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.UPDATE_MONTHLY_SAVINGS_SUBMIT,

  fields: [
    {
      key: SavingsGoalRegistryFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Updating',
      required: false,
    },
    {
      key: SavingsGoalRegistryFieldKey.NAME,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_NAME_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_NAME_PLACEHOLDER,
      required: false,
    },
    {
      key: SavingsGoalRegistryFieldKey.TARGET_AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_TARGET_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.ADD_MONTHLY_SAVINGS_TARGET_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    {
      key: 'updateSavingsGoal',
      transformData: (formValues, context) => {
        const existingName = formValues[SavingsGoalRegistryFieldKey.EXISTING_NAME] ?? '';
        const match = context.savingsGoals.find((g) => g.name === existingName);
        if (!match) return null;
        const data: Record<string, unknown> = {};
        if (formValues[SavingsGoalRegistryFieldKey.NAME]?.trim()) {
          data['name'] = formValues[SavingsGoalRegistryFieldKey.NAME];
        }
        if (formValues[SavingsGoalRegistryFieldKey.TARGET_AMOUNT]) {
          const v = parseFloat(formValues[SavingsGoalRegistryFieldKey.TARGET_AMOUNT]);
          if (!isNaN(v) && v > 0) data['targetAmount'] = v;
        }
        return { id: match.id, data };
      },
      errorLog: 'Failed to update savings goal:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.UPDATE_MONTHLY_SAVINGS_SUCCESS(
        formValues[SavingsGoalRegistryFieldKey.NAME] || formValues[SavingsGoalRegistryFieldKey.EXISTING_NAME] || ''
      ),
    failure: CHAT_REGISTRY_STRINGS.UPDATE_MONTHLY_SAVINGS_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.UPDATE_MONTHLY_SAVINGS_CANCELLED,
  },

  invalidations: [SAVINGS_GOALS_QUERY_KEY],

  validate: validateWithSchema(z.object({}).loose()),

  getInitialValues: (actionData, _context) => ({
    [SavingsGoalRegistryFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
    [SavingsGoalRegistryFieldKey.NAME]: typeof actionData['name'] === 'string' ? actionData['name'] : '',
    [SavingsGoalRegistryFieldKey.TARGET_AMOUNT]: String(actionData['targetAmount'] ?? ''),
  }),
};

const deleteMonthlySavingsEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.DELETE_MONTHLY_SAVINGS,
  title: CHAT_REGISTRY_STRINGS.DELETE_MONTHLY_SAVINGS_TITLE,
  formType: 'deleteConfirm',
  buttonVariant: ButtonVariant.DANGER,
  submitLabel: CHAT_REGISTRY_STRINGS.DELETE_MONTHLY_SAVINGS_SUBMIT,

  fields: [
    {
      key: DeleteSavingsGoalFieldKey.EXISTING_NAME,
      type: 'static',
      label: 'Name',
      required: true,
    },
  ],

  mutations: [
    {
      key: 'removeSavingsGoal',
      transformData: (formValues, context) => {
        const name = formValues[DeleteSavingsGoalFieldKey.EXISTING_NAME] ?? '';
        const match = context.savingsGoals.find((g) => g.name === name);
        return match?.id ?? '';
      },
      errorLog: 'Failed to delete savings goal:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.DELETE_MONTHLY_SAVINGS_SUCCESS(formValues[DeleteSavingsGoalFieldKey.EXISTING_NAME] ?? ''),
    failure: CHAT_REGISTRY_STRINGS.DELETE_MONTHLY_SAVINGS_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.DELETE_MONTHLY_SAVINGS_CANCELLED,
  },

  invalidations: [SAVINGS_GOALS_QUERY_KEY],

  validate: validateWithSchema(
    z.object({
      [DeleteSavingsGoalFieldKey.EXISTING_NAME]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_ITEM_NOT_FOUND('') }),
    }).loose()
  ),

  getInitialValues: (actionData, _context) => ({
    [DeleteSavingsGoalFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
  }),
};

// ============================================
// LOG_SAVINGS
// ============================================

const logSavingsEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.LOG_SAVINGS,
  title: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.PRIMARY,
  submitLabel: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_SUBMIT,

  fields: [
    {
      key: LogSavingsFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_AMOUNT_PLACEHOLDER,
      required: true,
    },
    {
      key: LogSavingsFieldKey.DESTINATION,
      type: 'picker',
      label: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_DEPOSIT_TO_LABEL,
      optionsSource: 'savingsGoalsWithAdhoc',
      modalTitle: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_DEPOSIT_TO_MODAL_TITLE,
      required: true,
    },
    {
      key: LogSavingsFieldKey.SAVINGS_TYPE,
      type: 'picker',
      label: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_SAVINGS_TYPE_LABEL,
      optionsSource: 'savingsTypes',
      modalTitle: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_SAVINGS_TYPE_MODAL_TITLE,
      required: false,
      showIf: { field: LogSavingsFieldKey.DESTINATION, equals: ADHOC_VALUE },
    },
    {
      key: LogSavingsFieldKey.DESCRIPTION,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_DESCRIPTION_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_DESCRIPTION_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    {
      key: 'createExpense',
      transformData: (formValues, context) => {
        const destination = formValues[LogSavingsFieldKey.DESTINATION] ?? '';
        const isAdHoc = destination === ADHOC_VALUE;

        if (isAdHoc) {
          return {
            amount: parseFloat(formValues[LogSavingsFieldKey.AMOUNT] ?? '0'),
            isSaving: 1,
            isWithdrawal: 0,
            savingsGoalId: undefined,
            savingsType: formValues[LogSavingsFieldKey.SAVINGS_TYPE] ?? SavingsTypeEnum.OTHER,
            description: formValues[LogSavingsFieldKey.DESCRIPTION]?.trim() || undefined,
            excludeFromSpending: 1,
          };
        }

        // Resolve goal to get its type
        const matchedGoal = context.savingsGoals.find((g) => g.id === destination);
        return {
          amount: parseFloat(formValues[LogSavingsFieldKey.AMOUNT] ?? '0'),
          isSaving: 1,
          isWithdrawal: 0,
          savingsGoalId: destination,
          savingsType: matchedGoal?.type ?? SavingsTypeEnum.OTHER,
          description: formValues[LogSavingsFieldKey.DESCRIPTION]?.trim() || undefined,
          excludeFromSpending: 1,
        };
      },
      errorLog: 'Failed to save savings deposit:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.LOG_SAVINGS_SUCCESS(parseFloat(formValues[LogSavingsFieldKey.AMOUNT] ?? '0')),
    failure: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.LOG_SAVINGS_CANCELLED,
  },

  invalidations: [
    SAVINGS_GOALS_QUERY_KEY,
    SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
    ADHOC_SAVINGS_BALANCES_QUERY_KEY,
    MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
  ],

  validate: validateWithSchema(
    z.object({
      [LogSavingsFieldKey.AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED }),
      [LogSavingsFieldKey.DESTINATION]: z.string().min(1, { message: CHAT_REGISTRY_STRINGS.VALIDATION_DESTINATION_REQUIRED }),
      [LogSavingsFieldKey.SAVINGS_TYPE]: z.string().optional(),
    })
    .loose()
    .superRefine((data, ctx) => {
      if (data[LogSavingsFieldKey.DESTINATION] === ADHOC_VALUE && !data[LogSavingsFieldKey.SAVINGS_TYPE]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: CHAT_REGISTRY_STRINGS.VALIDATION_SAVINGS_TYPE_REQUIRED, path: [LogSavingsFieldKey.SAVINGS_TYPE] });
      }
    })
  ),

  getInitialValues: (actionData, context) => {
    // Resolve savingsGoalId from actionData — fall back to ad-hoc
    const rawGoalId = typeof actionData['savingsGoalId'] === 'string' ? actionData['savingsGoalId'] : null;
    const matchedGoal = rawGoalId ? context.savingsGoals.find((g) => g.id === rawGoalId) : null;
    const destination = matchedGoal ? matchedGoal.id : ADHOC_VALUE;

    const rawSavingsType =
      typeof actionData['savingsType'] === 'string' ? actionData['savingsType'] : SavingsTypeEnum.OTHER;
    const savingsType = (SAVINGS_TYPES as readonly string[]).includes(rawSavingsType)
      ? rawSavingsType
      : SavingsTypeEnum.OTHER;

    return {
      [LogSavingsFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
      [LogSavingsFieldKey.DESTINATION]: destination,
      [LogSavingsFieldKey.SAVINGS_TYPE]: savingsType,
      [LogSavingsFieldKey.DESCRIPTION]: typeof actionData['description'] === 'string' ? actionData['description'] : '',
    };
  },
};

// ============================================
// WITHDRAW_SAVINGS (multi-step mutation)
// ============================================

const withdrawSavingsEntry: IntentRegistryEntry = {
  intent: ChatIntentEnum.WITHDRAW_SAVINGS,
  title: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_TITLE,
  formType: 'default',
  buttonVariant: ButtonVariant.DANGER,
  submitLabel: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_SUBMIT,

  fields: [
    {
      key: WithdrawSavingsFieldKey.SOURCE_LABEL,
      type: 'static',
      label: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_SOURCE_LABEL,
      required: false,
    },
    {
      key: WithdrawSavingsFieldKey.AVAILABLE_BALANCE,
      type: 'static',
      label: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_BALANCE_LABEL,
      required: false,
    },
    {
      key: WithdrawSavingsFieldKey.AMOUNT,
      type: 'number',
      label: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_AMOUNT_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_AMOUNT_PLACEHOLDER,
      required: true,
    },
    {
      key: WithdrawSavingsFieldKey.REASON,
      type: 'text',
      label: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_REASON_LABEL,
      placeholder: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_REASON_PLACEHOLDER,
      required: false,
    },
  ],

  mutations: [
    // Step 1: create savings withdrawal expense (isSaving=1, isWithdrawal=1)
    {
      key: 'createExpense',
      transformData: (formValues, _context) => {
        const goalId = formValues[WithdrawSavingsFieldKey.SAVINGS_GOAL_ID];
        const savingsType = formValues[WithdrawSavingsFieldKey.SAVINGS_TYPE];
        return {
          amount: parseFloat(formValues[WithdrawSavingsFieldKey.AMOUNT] ?? '0'),
          isSaving: 1,
          isWithdrawal: 1,
          savingsGoalId: goalId || undefined,
          savingsType: savingsType || undefined,
          excludeFromSpending: 1,
        };
      },
      errorLog: 'Failed to process savings withdrawal expense:',
    },
    // Step 2: create income entry of type savings_withdrawal
    {
      key: 'createIncome',
      transformData: (formValues, _context) => ({
        amount: parseFloat(formValues[WithdrawSavingsFieldKey.AMOUNT] ?? '0'),
        type: IncomeTypeEnum.SAVINGS_WITHDRAWAL,
      }),
      errorLog: 'Failed to process savings withdrawal income:',
    },
  ],

  messages: {
    success: (formValues) =>
      CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_SUCCESS(parseFloat(formValues[WithdrawSavingsFieldKey.AMOUNT] ?? '0')),
    failure: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_FAILURE,
    cancelled: CHAT_REGISTRY_STRINGS.WITHDRAW_SAVINGS_CANCELLED,
  },

  invalidations: [
    SAVINGS_BALANCES_ALL_GOALS_QUERY_KEY,
    ADHOC_SAVINGS_BALANCES_QUERY_KEY,
    MONTHLY_DEPOSITS_BY_GOAL_QUERY_KEY,
    INCOME_QUERY_KEY,
    MONTHLY_INCOME_SUM_QUERY_KEY,
  ],

  validate: validateWithSchema(
    z.object({
      [WithdrawSavingsFieldKey.AMOUNT]: z.coerce
        .number({ error: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED })
        .positive({ message: CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED }),
      [WithdrawSavingsFieldKey.AVAILABLE_BALANCE]: z.string().optional(),
    })
    .loose()
    .superRefine((data, ctx) => {
      const amount = parseFloat(String(data[WithdrawSavingsFieldKey.AMOUNT] ?? ''));
      const availableBalance = parseFloat(data[WithdrawSavingsFieldKey.AVAILABLE_BALANCE] ?? '0');
      if (!isNaN(amount) && !isNaN(availableBalance) && amount > availableBalance) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: CHAT_REGISTRY_STRINGS.VALIDATION_EXCEEDS_BALANCE, path: [WithdrawSavingsFieldKey.AMOUNT] });
      }
    })
  ),

  getInitialValues: (actionData, _context) => {
    const sourceLabel = typeof actionData['sourceLabel'] === 'string' ? actionData['sourceLabel'] : '';
    const availableBalance = typeof actionData['availableBalance'] === 'number' ? actionData['availableBalance'] : 0;
    const savingsGoalId = typeof actionData['savingsGoalId'] === 'string' ? actionData['savingsGoalId'] : '';
    const savingsType = typeof actionData['savingsType'] === 'string' ? actionData['savingsType'] : '';
    return {
      [WithdrawSavingsFieldKey.SOURCE_LABEL]: sourceLabel,
      [WithdrawSavingsFieldKey.AVAILABLE_BALANCE]: formatCurrency(availableBalance),
      [WithdrawSavingsFieldKey.AMOUNT]: String(actionData['amount'] ?? ''),
      [WithdrawSavingsFieldKey.REASON]: '',
      // hidden keys
      [WithdrawSavingsFieldKey.SAVINGS_GOAL_ID]: savingsGoalId,
      [WithdrawSavingsFieldKey.SAVINGS_TYPE]: savingsType,
    };
  },
};

// ============================================
// REGISTRY MAP
// ============================================

export const INTENT_REGISTRY: Readonly<Record<string, IntentRegistryEntry>> = {
  [ChatIntentEnum.ADD_EXPENSE]: addExpenseEntry,
  [ChatIntentEnum.ADD_INCOME]: addIncomeEntry,
  [ChatIntentEnum.DELETE_FIXED_EXPENSE]: deleteFixedExpenseEntry,
  [ChatIntentEnum.UPDATE_PROFILE]: updateProfileEntry,
  [ChatIntentEnum.ADD_FIXED_EXPENSE]: addFixedExpenseEntry,
  [ChatIntentEnum.UPDATE_FIXED_EXPENSE]: updateFixedExpenseEntry,
  [ChatIntentEnum.ADD_DEBT]: addDebtEntry,
  [ChatIntentEnum.UPDATE_DEBT]: updateDebtEntry,
  [ChatIntentEnum.DELETE_DEBT]: deleteDebtEntry,
  [ChatIntentEnum.ADD_MONTHLY_SAVINGS]: addMonthlySavingsEntry,
  [ChatIntentEnum.UPDATE_MONTHLY_SAVINGS]: updateMonthlySavingsEntry,
  [ChatIntentEnum.DELETE_MONTHLY_SAVINGS]: deleteMonthlySavingsEntry,
  [ChatIntentEnum.LOG_SAVINGS]: logSavingsEntry,
  [ChatIntentEnum.WITHDRAW_SAVINGS]: withdrawSavingsEntry,
};

/** The set of intent values that have been migrated to the registry. */
export const REGISTRY_INTENTS = new Set<string>(Object.keys(INTENT_REGISTRY));
