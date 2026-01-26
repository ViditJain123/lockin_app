import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLocalDateString, getLocalDateStringDaysAgo } from '../lib/dateUtils';
import { DailyActivity } from '../lib/statsService';
import { useHeatmapStore } from './useHeatmapStore';
import { useVideoStore } from './useVideoStore';

// Minimum daily minutes for streak counting (1 hour = 60 minutes)
const MIN_DAILY_MINUTES_FOR_STREAK = 60;
// Minimum grind duration for counting as a "grind" (1 hour = 3600 seconds)
const MIN_GRIND_SECONDS = 3600;

/**
 * Calculate streak from heatmap activity data
 * Streak = consecutive days with >= 1 hour of activity
 */
function calculateStreakFromHeatmap(activityByDate: Record<string, number>): number {
  let streak = 0;
  let daysBack = 0;

  // Check today first
  const today = getLocalDateString();
  const todayMinutes = activityByDate[today] || 0;

  if (todayMinutes >= MIN_DAILY_MINUTES_FOR_STREAK) {
    // Today qualifies, start streak at 1
    streak = 1;
    daysBack = 1;
  } else {
    // Today doesn't qualify yet, start checking from yesterday
    daysBack = 1;
  }

  // Check consecutive days backwards
  while (true) {
    const dateStr = getLocalDateStringDaysAgo(daysBack);
    const minutes = activityByDate[dateStr] || 0;

    if (minutes >= MIN_DAILY_MINUTES_FOR_STREAK) {
      if (streak === 0) {
        // Yesterday qualified, count it as start of streak
        streak = 1;
      } else {
        streak++;
      }
      daysBack++;
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
}

// Storage key
const PROFILE_STORAGE_KEY = 'lockin-profile-state';

// Staleness threshold in milliseconds (30 seconds)
const STALE_THRESHOLD_MS = 30 * 1000;

interface ProfileState {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
  dailyActivity: DailyActivity[];
  isLoading: boolean;
  isLoadingActivity: boolean;
  error: string | null;

  // Staleness tracking
  lastFetchedAt: number | null;
  lastFetchedUserId: string | null;

  // Hydration state
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  computeStatsFromLocalData: () => void;
  fetchStats: (userId: string) => Promise<void>;
  fetchActivity: (userId: string) => Promise<void>;
  refreshAll: (userId: string) => Promise<void>;
  fetchIfStale: (userId: string, forceRefresh?: boolean) => Promise<void>;
  isDataStale: (userId: string) => boolean;
  incrementHoursLocally: (additionalHours: number) => void;
  addActivityLocally: (minutes: number) => void;
  resetStats: () => void;
  updateStatsLocally: (hours: number, grinds: number, streak: number) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      totalHours: 0,
      totalGrinds: 0,
      currentStreak: 0,
      dailyActivity: [],
      isLoading: false,
      isLoadingActivity: false,
      error: null,
      lastFetchedAt: null,
      lastFetchedUserId: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Compute stats from local video data and heatmap (no Supabase)
      computeStatsFromLocalData: () => {
        const videos = useVideoStore.getState().videos;
        const heatmapData = useHeatmapStore.getState().activityByDate;

        // Calculate total hours from all videos
        const totalSeconds = videos.reduce((sum, v) => sum + v.durationSeconds, 0);
        const totalHours = totalSeconds / 3600;

        // Calculate total grinds (videos >= 1 hour)
        const totalGrinds = videos.filter(v => v.durationSeconds >= MIN_GRIND_SECONDS).length;

        // Calculate streak from heatmap data
        const currentStreak = calculateStreakFromHeatmap(heatmapData);

        console.log('[ProfileStore] Computed local stats:', {
          totalHours: totalHours.toFixed(2),
          totalGrinds,
          currentStreak,
          videoCount: videos.length,
        });

        set({
          totalHours,
          totalGrinds,
          currentStreak,
          lastFetchedAt: Date.now(),
        });
      },

      // Check if cached data is stale or belongs to a different user
      isDataStale: (userId: string): boolean => {
        const { lastFetchedAt, lastFetchedUserId } = get();

        // Data is stale if it's for a different user
        if (lastFetchedUserId !== userId) {
          return true;
        }

        // Data is stale if never fetched
        if (lastFetchedAt === null) {
          return true;
        }

        // Data is stale if older than threshold
        const age = Date.now() - lastFetchedAt;
        return age > STALE_THRESHOLD_MS;
      },

      // Fetch only if data is stale or forceRefresh is true
      fetchIfStale: async (userId: string, forceRefresh = false) => {
        const { isDataStale, fetchStats, fetchActivity, isLoading } = get();

        // Don't fetch if already loading
        if (isLoading) {
          return;
        }

        // Only fetch if stale or forced
        if (forceRefresh || isDataStale(userId)) {
          await Promise.all([
            fetchStats(userId),
            fetchActivity(userId),
          ]);
        }
      },

      fetchStats: async (userId: string) => {
        set({ isLoading: true, error: null });

        // Compute stats from local data instead of Supabase
        get().computeStatsFromLocalData();

        set({
          isLoading: false,
          lastFetchedAt: Date.now(),
          lastFetchedUserId: userId,
        });
      },

      fetchActivity: async (_userId: string) => {
        set({ isLoadingActivity: true });

        // Read from local heatmap store (using local timezone)
        const activity = useHeatmapStore.getState().getDailyActivity();

        set({
          dailyActivity: activity,
          isLoadingActivity: false,
        });
      },

      // Refresh all profile data (stats and activity) - used for pull-to-refresh
      refreshAll: async (userId: string) => {
        const { fetchStats, fetchActivity } = get();
        await Promise.all([
          fetchStats(userId),
          fetchActivity(userId),
        ]);
      },

      resetStats: () => {
        set({
          totalHours: 0,
          totalGrinds: 0,
          currentStreak: 0,
          dailyActivity: [],
          isLoading: false,
          isLoadingActivity: false,
          error: null,
          lastFetchedAt: null,
          lastFetchedUserId: null,
        });
      },

      updateStatsLocally: (hours: number, grinds: number, streak: number) => {
        set({
          totalHours: hours,
          totalGrinds: grinds,
          currentStreak: streak,
          lastFetchedAt: Date.now(), // Mark as fresh since we just updated
        });
      },

      incrementHoursLocally: (additionalHours: number) => {
        set((state) => ({
          totalHours: state.totalHours + additionalHours,
          lastFetchedAt: Date.now(), // Mark as fresh since we just updated
        }));
      },

      addActivityLocally: (minutes: number) => {
        const today = getLocalDateString(); // Use local timezone
        set((state) => {
          const existingIndex = state.dailyActivity.findIndex(a => a.date === today);
          if (existingIndex >= 0) {
            // Update existing entry for today
            const updated = [...state.dailyActivity];
            updated[existingIndex] = {
              ...updated[existingIndex],
              totalMinutes: updated[existingIndex].totalMinutes + minutes,
            };
            return {
              dailyActivity: updated,
              lastFetchedAt: Date.now(), // Mark as fresh since we just updated
            };
          }
          // Add new entry for today
          return {
            dailyActivity: [...state.dailyActivity, { date: today, totalMinutes: minutes }],
            lastFetchedAt: Date.now(), // Mark as fresh since we just updated
          };
        });
      },
    }),
    {
      name: PROFILE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalHours: state.totalHours,
        totalGrinds: state.totalGrinds,
        currentStreak: state.currentStreak,
        lastFetchedAt: state.lastFetchedAt,
        lastFetchedUserId: state.lastFetchedUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
