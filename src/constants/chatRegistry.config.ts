/**
 * Intent Registry — single source of truth for all registry-based chat intents.
 *
 * Each entry is a declarative config object. The generic form + action handler
 * read from here; no per-intent logic lives outside this file.
 */
import { ChatIntentEnum, CreditCardTxnTypeEnum, IncomeTypeEnum, USER_INCOME_TYPES } from '@/db/types';
import { formatDate as formatDbDate } from '@/db/utils';
import {
  EXPENSES_QUERY_KEY,
  FIXED_EXPENSES_QUERY_KEY,
  INCOME_QUERY_KEY,
  MONTHLY_INCOME_SUM_QUERY_KEY,
} from '@/src/hooks';
import { isISODateString } from '@/src/utils/date';
import type { IntentRegistryEntry } from '@/src/types/chatRegistry';
import { CHAT_REGISTRY_STRINGS } from './chat.registry.strings';
import { ButtonVariant } from './theme';
import dayjs from 'dayjs';

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

  validate: (formValues) => {
    const errors: Record<string, string> = {};
    const parsed = parseFloat(formValues[ExpenseFieldKey.AMOUNT] ?? '');
    if (!formValues[ExpenseFieldKey.AMOUNT] || isNaN(parsed) || parsed <= 0) {
      errors[ExpenseFieldKey.AMOUNT] = CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED;
    }
    if (!formValues[ExpenseFieldKey.CATEGORY_ID]) {
      errors[ExpenseFieldKey.CATEGORY_ID] = CHAT_REGISTRY_STRINGS.VALIDATION_CATEGORY_REQUIRED;
    }
    return Object.keys(errors).length > 0 ? errors : null;
  },

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

  validate: (formValues) => {
    const errors: Record<string, string> = {};
    const parsed = parseFloat(formValues[IncomeFieldKey.AMOUNT] ?? '');
    if (!formValues[IncomeFieldKey.AMOUNT] || isNaN(parsed) || parsed <= 0) {
      errors[IncomeFieldKey.AMOUNT] = CHAT_REGISTRY_STRINGS.VALIDATION_AMOUNT_REQUIRED;
    }
    if (!formValues[IncomeFieldKey.TYPE]) {
      errors[IncomeFieldKey.TYPE] = CHAT_REGISTRY_STRINGS.VALIDATION_INCOME_TYPE_REQUIRED;
    }
    if (formValues[IncomeFieldKey.TYPE] === IncomeTypeEnum.OTHER && !formValues[IncomeFieldKey.CUSTOM_TYPE]?.trim()) {
      errors[IncomeFieldKey.CUSTOM_TYPE] = CHAT_REGISTRY_STRINGS.VALIDATION_CUSTOM_TYPE_REQUIRED;
    }
    const date = formValues[IncomeFieldKey.DATE] ?? '';
    if (!date || !isISODateString(date)) {
      errors[IncomeFieldKey.DATE] = CHAT_REGISTRY_STRINGS.VALIDATION_DATE_REQUIRED;
    }
    return Object.keys(errors).length > 0 ? errors : null;
  },

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

  validate: (formValues) => {
    if (!formValues[DeleteFixedExpenseFieldKey.EXISTING_NAME]?.trim()) {
      return { [DeleteFixedExpenseFieldKey.EXISTING_NAME]: CHAT_REGISTRY_STRINGS.VALIDATION_ITEM_NOT_FOUND('') };
    }
    return null;
  },

  getInitialValues: (actionData, _context) => ({
    [DeleteFixedExpenseFieldKey.EXISTING_NAME]:
      typeof actionData['existingName'] === 'string' ? actionData['existingName'] : '',
  }),
};

// ============================================
// REGISTRY MAP
// ============================================

export const INTENT_REGISTRY: Readonly<Record<string, IntentRegistryEntry>> = {
  [ChatIntentEnum.ADD_EXPENSE]: addExpenseEntry,
  [ChatIntentEnum.ADD_INCOME]: addIncomeEntry,
  [ChatIntentEnum.DELETE_FIXED_EXPENSE]: deleteFixedExpenseEntry,
};

/** The set of intent values that have been migrated to the registry. */
export const REGISTRY_INTENTS = new Set<string>(Object.keys(INTENT_REGISTRY));
