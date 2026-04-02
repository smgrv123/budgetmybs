import { useQuery } from '@tanstack/react-query';
import { withSilentReauth } from '@/src/services/splitwise';

export type SplitTarget = {
  id: string; // "friend_123" | "group_456"
  splitwiseId: number;
  type: 'friend' | 'group';
  label: string;
  memberCount?: number; // groups only
};

export const SPLIT_TARGETS_QUERY_KEY = ['splitwise', 'splitTargets'] as const;

export const useSplitTargets = () => {
  const query = useQuery({
    queryKey: SPLIT_TARGETS_QUERY_KEY,
    queryFn: async (): Promise<SplitTarget[]> => {
      const result = await withSilentReauth(async (client) => {
        const [friendsRes, groupsRes] = await Promise.all([client.friends.getFriends(), client.groups.getGroups()]);

        const friends: SplitTarget[] = (friendsRes?.friends ?? []).map((f) => ({
          id: `friend_${f.id}`,
          splitwiseId: f.id!,
          type: 'friend' as const,
          label: [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Unknown',
        }));

        const groups: SplitTarget[] = (groupsRes?.groups ?? [])
          .filter((g) => g.id !== 0 && (g.members?.length ?? 0) > 1)
          .map((g) => ({
            id: `group_${g.id}`,
            splitwiseId: g.id!,
            type: 'group' as const,
            label: g.name ?? 'Unnamed Group',
            memberCount: g.members?.length,
          }));

        return [...groups, ...friends];
      });

      return result ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    targets: query.data ?? [],
    isLoading: query.isLoading,
  };
};
