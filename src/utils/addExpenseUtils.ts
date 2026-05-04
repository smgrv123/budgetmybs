import dayjs from 'dayjs';
import { z } from 'zod';

import { CooldownPreset, PRESET_DEFINITIONS, toMinutes } from '@/src/constants/impulse.config';
import type { CooldownPresetType, CooldownUnitType, PendingImpulsePurchase } from '@/src/types/impulse';
import { generateUUID } from '@/src/utils/id';

/**
 * Resolve cooldown duration to minutes from a preset or custom value/unit.
 * Returns null if the selection is incomplete or invalid.
 */
export const resolveCooldownMinutes = (
  selectedPreset: CooldownPresetType | null,
  customValue: string,
  customUnit: CooldownUnitType
): number | null => {
  if (!selectedPreset) return null;

  if (selectedPreset !== CooldownPreset.CUSTOM) {
    const preset = PRESET_DEFINITIONS.find((p) => p.preset === selectedPreset);
    return preset?.minutes ?? null;
  }

  // Custom
  const numVal = parseInt(customValue, 10);
  if (!customValue || isNaN(numVal) || numVal <= 0) return null;
  return toMinutes(numVal, customUnit);
};

type RawExpenseInput = {
  amount: string;
  category: string;
  description: string;
  date: string;
  creditCardId: string;
};

/**
 * Parse and validate raw form input against a Zod schema.
 * Returns the typed result on success, null on failure.
 */
export const buildValidatedExpenseData = <T>(raw: RawExpenseInput, schema: z.ZodType<T>): T | null => {
  const amountNum = parseFloat(raw.amount);
  const normalizedCreditCardId = raw.creditCardId.trim() || undefined;
  const validationResult = schema.safeParse({
    amount: amountNum,
    category: raw.category,
    description: raw.description || undefined,
    date: raw.date,
    creditCardId: normalizedCreditCardId,
  });
  if (!validationResult.success) return null;
  return validationResult.data;
};

type ImpulseEntryInput = {
  amount: number;
  category: string;
  description?: string;
  date: string;
  creditCardId?: string;
};

/**
 * Build a PendingImpulsePurchase entry from validated expense data and a cooldown duration.
 */
export const buildImpulseEntry = (data: ImpulseEntryInput, cooldownMinutes: number): PendingImpulsePurchase => {
  const now = dayjs();
  return {
    id: generateUUID(),
    purchaseData: (({ category: cat, ...rest }) => ({ ...rest, categoryId: cat }))(data),
    cooldownMinutes,
    expiresAt: now.add(cooldownMinutes, 'minute').toISOString(),
    notificationId: null,
    createdAt: now.toISOString(),
  };
};
