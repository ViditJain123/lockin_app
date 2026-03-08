import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchProfileStats } from '@/lib/tinybird';
import { useSessionStore, type LocalSession } from './useSessionStore';

interface ProfileStatsState {
  total_hours: number;
  grinds: number;
  streak: number;
  hasHydrated: boolean;
  baselineStats: { total_hours: number; grinds: number; streak: number };
  baselineFetched: boolean;
  setStats: (stats: { total_hours: number; grinds: number; streak: number }) => void;
  setHasHydrated: (v: boolean) => void;
  recomputeFromSessions: (userId?: string) => void;
  fetchAndStoreBaseline: (userId: string) => Promise<void>;
}

export function computeTotalHours(sessions: LocalSession[]): number {
  const totalSeconds = sessions.reduce((sum, s) => sum + s.total_locked_in_seconds, 0);
  return totalSeconds / 3600;
}

export function computeGrinds(sessions: LocalSession[]): number {
  return sessions.filter(
    (s) => s.total_locked_in_seconds + s.total_distracted_seconds >= 3600
  ).length;
}

export function computeStreak(sessions: LocalSession[]): number {
  if (sessions.length === 0) {
    console.log('[Streak] No sessions, returning 0');
    return 0;
  }

  // Get unique dates sorted descending
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  if (uniqueDates.length === 0) {
    console.log('[Streak] No unique dates, returning 0');
    return 0;
  }

  // Streak must start from today or yesterday
  const today = new Date();
  const todayStr = formatDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);

  console.log('[Streak] Unique dates (desc):', uniqueDates);
  console.log('[Streak] Today:', todayStr, '| Yesterday:', yesterdayStr);
  console.log('[Streak] Most recent session date:', uniqueDates[0]);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    console.log('[Streak] Most recent date is neither today nor yesterday → streak = 0');
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`[Streak] Checking ${uniqueDates[i-1]} → ${uniqueDates[i]}: diff=${diffDays} day(s), streak so far=${streak}`);
    if (diffDays === 1) {
      streak++;
    } else {
      console.log(`[Streak] Gap detected, stopping`);
      break;
    }
  }
  console.log('[Streak] Final streak:', streak);
  return streak;
}

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useProfileStatsStore = create<ProfileStatsState>()(
  persist(
    (set, get) => ({
      total_hours: 0,
      grinds: 0,
      streak: 0,
      hasHydrated: false,
      baselineStats: { total_hours: 0, grinds: 0, streak: 0 },
      baselineFetched: false,

      setStats: (stats) => set(stats),
      setHasHydrated: (v) => set({ hasHydrated: v }),

      recomputeFromSessions: (userId?: string) => {
        const sessions = useSessionStore.getState().sessions;
        const baseline = get().baselineStats;

        const localHours = computeTotalHours(sessions);
        const localGrinds = computeGrinds(sessions);
        const localStreak = computeStreak(sessions);

        const merged = {
          total_hours: baseline.total_hours + localHours,
          grinds: baseline.grinds + localGrinds,
          streak: Math.max(baseline.streak, localStreak),
        };

        console.log('[ProfileStats] recomputeFromSessions:', {
          baseline,
          localSessionCount: sessions.length,
          localHours,
          localGrinds,
          localStreak,
          merged,
        });

        set(merged);

        // Fetch authoritative streak from Tinybird (async, updates when ready)
        if (userId) {
          fetchProfileStats(userId)
            .then((tinybirdStats) => {
              const currentStreak = get().streak;
              const tinybirdStreak = tinybirdStats.streak;
              console.log('[ProfileStats] Tinybird streak:', tinybirdStreak, '| local streak:', currentStreak);
              if (tinybirdStreak > currentStreak) {
                console.log('[ProfileStats] Updating streak from Tinybird:', tinybirdStreak);
                set({ streak: tinybirdStreak });
              }
            })
            .catch((err) => {
              console.warn('[ProfileStats] Failed to fetch Tinybird streak, using local:', err);
            });
        }
      },

      fetchAndStoreBaseline: async (userId: string) => {
        const { baselineFetched } = get();
        const sessions = useSessionStore.getState().sessions;

        if (baselineFetched || sessions.length > 0) {
          console.log('[ProfileStats] fetchAndStoreBaseline SKIPPED:', {
            baselineFetched,
            localSessionCount: sessions.length,
          });
          return;
        }

        console.log('[ProfileStats] fetchAndStoreBaseline FETCHING for user:', userId);

        try {
          const stats = await fetchProfileStats(userId);
          console.log('[ProfileStats] fetchAndStoreBaseline GOT:', stats);
          set({
            baselineStats: stats,
            baselineFetched: true,
            total_hours: stats.total_hours,
            grinds: stats.grinds,
            streak: stats.streak,
          });
        } catch (err) {
          console.warn('[ProfileStats] Failed to fetch baseline:', err);
        }
      },
    }),
    {
      name: 'lockin-profile-stats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        total_hours: state.total_hours,
        grinds: state.grinds,
        streak: state.streak,
        baselineStats: state.baselineStats,
        baselineFetched: state.baselineFetched,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[ProfileStats] Hydrated:', {
            total_hours: state.total_hours,
            grinds: state.grinds,
            streak: state.streak,
            baselineStats: state.baselineStats,
            baselineFetched: state.baselineFetched,
          });
          state.setHasHydrated(true);
          // Migration: if old stats exist but baseline was never set,
          // adopt old persisted values as the baseline
          const { total_hours, grinds, streak, baselineStats, baselineFetched } = state;
          const hasOldStats = total_hours > 0 || grinds > 0 || streak > 0;
          const baselineIsZero =
            baselineStats.total_hours === 0 &&
            baselineStats.grinds === 0 &&
            baselineStats.streak === 0;
          if (hasOldStats && baselineIsZero && !baselineFetched) {
            console.log('[ProfileStats] Migration: adopting old stats as baseline:', { total_hours, grinds, streak });
            useProfileStatsStore.setState({
              baselineStats: { total_hours, grinds, streak },
              baselineFetched: true,
            });
          }
        } else {
          console.log('[ProfileStats] Hydration returned null state (fresh install)');
        }
      },
    }
  )
);
