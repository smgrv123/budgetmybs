/**
 * Types for the Impulse Buy Cooldown feature
 */

export type { CooldownUnitType, CooldownPresetType } from '@/src/constants/impulse.config';

// ─── Impulse purchase data (what we store) ────────────────────────────────────

export type ImpulsePurchaseData = {
  amount: number;
  categoryId: string;
  description?: string;
  creditCardId?: string;
  date: string;
};

export type PendingImpulsePurchase = {
  /** Unique ID for this pending entry (generated at save time) */
  id: string;
  /** The underlying purchase data */
  purchaseData: ImpulsePurchaseData;
  /** Duration in minutes */
  cooldownMinutes: number;
  /** ISO timestamp when the cooldown expires */
  expiresAt: string;
  /** Placeholder for notification ID — populated in Phase 2B */
  notificationId: string | null;
  /** ISO timestamp when this entry was created */
  createdAt: string;
};
