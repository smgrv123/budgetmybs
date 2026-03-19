import { withSilentReauth } from '@/src/services/splitwise';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FriendBalance = {
  id: string;
  name: string;
  avatar: string | null;
  inrBalance: number; // positive = friend owes user; negative = user owes friend
};

export type SplitwiseBalanceSummary = {
  totalOwed: number; // sum of positive INR balances (friends owe user)
  totalOwing: number; // sum of absolute negative balances (user owes friends)
  friends: FriendBalance[];
};

const EMPTY_SUMMARY: SplitwiseBalanceSummary = { totalOwed: 0, totalOwing: 0, friends: [] };

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetches friend balances from the Splitwise API.
 * Filters to INR only and skips fully-settled friends (balance = 0).
 * Returns zeros when not connected or on network error.
 */
export const fetchFriendBalances = async (): Promise<SplitwiseBalanceSummary> => {
  const result = await withSilentReauth(async (client) => {
    const response = await client.friends.getFriends();
    const rawFriends = response?.friends ?? [];

    const friends: FriendBalance[] = [];

    for (const friend of rawFriends) {
      const inrEntry = friend.balance?.find((b) => b.currency_code === 'INR');
      const inrBalance = inrEntry ? parseFloat(inrEntry.amount ?? '0') : 0;

      // Skip fully settled friends
      if (Math.abs(inrBalance) < 0.01) continue;

      const name = [friend.first_name, friend.last_name].filter(Boolean).join(' ') || 'Unknown';
      const avatar = friend.picture?.medium ?? null;

      friends.push({ id: String(friend.id), name, avatar, inrBalance });
    }

    const totalOwed = friends.filter((f) => f.inrBalance > 0).reduce((sum, f) => sum + f.inrBalance, 0);

    const totalOwing = friends.filter((f) => f.inrBalance < 0).reduce((sum, f) => sum + Math.abs(f.inrBalance), 0);

    return { totalOwed, totalOwing, friends };
  });

  return result ?? EMPTY_SUMMARY;
};
