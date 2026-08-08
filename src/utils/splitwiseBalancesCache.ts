/**
 * Cache helpers for Splitwise friend balances.
 *
 * Reads and writes the SplitwiseFriendBalanceCache from/to AsyncStorage,
 * and checks whether a cached snapshot is still fresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import { AsyncStorageKeys } from '@/src/constants/asyncStorageKeys';
import { SPLITWISE_STALE_THRESHOLD_MS } from '@/src/constants/splitwise.config';
import type { SplitwiseFriendBalanceCache, SplitwiseFriendBalanceEntry } from '@/src/types/splitwise';

export const isValidCache = (parsed: unknown): parsed is SplitwiseFriendBalanceCache => {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const obj = parsed as Record<string, unknown>;
  return typeof obj['fetchedAt'] === 'string' && Array.isArray(obj['friends']);
};

export const readFriendBalancesCache = async (): Promise<SplitwiseFriendBalanceCache | null> => {
  const raw = await AsyncStorage.getItem(AsyncStorageKeys.SPLITWISE_FRIEND_BALANCES);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeFriendBalancesCache = async (entries: SplitwiseFriendBalanceEntry[]): Promise<void> => {
  const cache: SplitwiseFriendBalanceCache = {
    fetchedAt: dayjs().toISOString(),
    friends: entries,
  };
  await AsyncStorage.setItem(AsyncStorageKeys.SPLITWISE_FRIEND_BALANCES, JSON.stringify(cache));
};

export const isCacheStale = (fetchedAt: string): boolean => {
  return dayjs().valueOf() - dayjs(fetchedAt).valueOf() > SPLITWISE_STALE_THRESHOLD_MS;
};
