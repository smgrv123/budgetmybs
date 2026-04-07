/**
 * AsyncStorage-backed store for pending impulse purchases.
 *
 * Interface:
 *   save(entry)   — persist a new pending purchase
 *   getAll()      — retrieve all pending purchases
 *   getExpired()  — retrieve entries whose cooldown has passed
 *   remove(id)    — delete a single entry by ID
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import type { PendingImpulsePurchase } from '@/src/types/impulse';

const STORAGE_KEY = AsyncStorageKeys.PENDING_IMPULSE_PURCHASES;

const readAll = async (): Promise<PendingImpulsePurchase[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as PendingImpulsePurchase[];
};

const writeAll = async (entries: PendingImpulsePurchase[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

/**
 * Persist a new pending impulse purchase.
 */
export const saveImpulsePurchase = async (entry: PendingImpulsePurchase): Promise<void> => {
  const current = await readAll();
  current.push(entry);
  await writeAll(current);
};

/**
 * Retrieve all pending impulse purchases.
 */
export const getAllImpulsePurchases = async (): Promise<PendingImpulsePurchase[]> => {
  return readAll();
};

/**
 * Retrieve all pending impulse purchases whose cooldown has expired.
 */
export const getExpiredImpulsePurchases = async (): Promise<PendingImpulsePurchase[]> => {
  const all = await readAll();
  const now = dayjs();
  return all.filter((entry) => dayjs(entry.expiresAt).isBefore(now));
};

/**
 * Remove a single pending impulse purchase by ID.
 */
export const removeImpulsePurchase = async (id: string): Promise<void> => {
  const current = await readAll();
  const updated = current.filter((entry) => entry.id !== id);
  await writeAll(updated);
};
