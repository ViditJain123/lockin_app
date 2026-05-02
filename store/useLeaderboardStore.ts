import { create } from 'zustand';
import { fetchMonthlyLeaderboard, fetchMonthlyUserRank } from '../lib/tinybird';
import { supabase } from '../lib/supabase';

export interface LeaderboardUser {
  user_id: string;
  display_name: string | null;
  total_hours: number;
  rank: number;
}

interface LeaderboardState {
  entries: LeaderboardUser[];
  currentUserRank: number | null;
  currentUserHours: number | null;
  isLoading: boolean;
  lastFetched: number | null;
  fetchLeaderboard: (userId: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  currentUserRank: null,
  currentUserHours: null,
  isLoading: false,
  lastFetched: null,

  fetchLeaderboard: async (userId: string) => {
    console.log('[Leaderboard] fetchLeaderboard called for userId:', userId);
    // Throttle: skip if fetched within the last 30 seconds
    const now = Date.now();
    const { lastFetched } = get();
    if (lastFetched && now - lastFetched < 30_000) {
      console.log(
        '[Leaderboard] Skipping fetch — throttled, last fetched',
        Math.round((now - lastFetched) / 1000),
        's ago',
      );
      return;
    }

    set({ isLoading: true });

    try {
      // 1. Fetch leaderboard + user rank in parallel from Tinybird
      const [leaderboard, userRank] = await Promise.all([
        fetchMonthlyLeaderboard(),
        fetchMonthlyUserRank(userId),
      ]);
      console.log('[Leaderboard] Tinybird returned', {
        leaderboardCount: leaderboard.length,
        userRank,
      });

      // 2. Collect all user_ids to resolve display names
      const userIds = leaderboard.map((e) => e.user_id);
      if (userRank && !userIds.includes(userRank.user_id)) {
        userIds.push(userRank.user_id);
      }

      // 3. Batch-fetch display names from Supabase
      let nameMap = new Map<string, string | null>();
      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('leaderboard_profiles')
          .select('id, display_name')
          .in('id', userIds);

        if (error) {
          console.warn('[Leaderboard] Supabase display_name lookup error:', error);
        }
        if (data) {
          for (const row of data) {
            nameMap.set(row.id, row.display_name);
          }
        }
        console.log('[Leaderboard] Supabase display_name lookup:', {
          requested: userIds.length,
          resolved: nameMap.size,
        });
      }

      // 4. Merge: attach display names and rank to leaderboard entries
      const entries: LeaderboardUser[] = leaderboard.map((entry, index) => ({
        user_id: entry.user_id,
        display_name: nameMap.get(entry.user_id) ?? null,
        total_hours: entry.total_hours,
        rank: index + 1,
      }));

      set({
        entries,
        currentUserRank: userRank?.rank ?? null,
        currentUserHours: userRank?.total_hours ?? null,
        isLoading: false,
        lastFetched: Date.now(),
      });
      console.log(
        '[Leaderboard] State updated — entries:',
        entries.length,
        'currentUserRank:',
        userRank?.rank ?? null,
      );
    } catch (error) {
      console.warn('[Leaderboard] Error fetching leaderboard:', error);
      set({ isLoading: false });
    }
  },
}));
