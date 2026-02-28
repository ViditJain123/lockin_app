import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLocalDateString } from '../lib/dateUtils';
import { DailyActivity } from '../lib/statsService';
import { performFullPull } from '../lib/syncEngine';
import { useHeatmapStore } from './useHeatmapStore';

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
  fetchStats: (userId: string) => Promise<void>;
  fetchActivity: (userId: string) => Promise<void>;
  refreshAll: (userId: string) => Promise<void>;
  fetchIfStale: (userId: string, forceRefresh?: boolean) => Promise<void>;
  isDataStale: (userId: string) => boolean;
  incrementHoursLocally: (additionalHours: number) => void;
  addActivityLocally: (minutes: number) => void;
  resetStats: () => void;
  updateStatsLocally: (hours: number, grinds: number, streak: number, userId?: string) => void;

  // Called by sync engine after conflict resolution (DB is authoritative)
  updateFromRemote: (stats: { totalHours: number; totalGrinds: number; currentStreak: number }, userId?: string) => void;

  // Called by sync engine to update dailyActivity from derived heatmap
  updateDailyActivityFromHeatmap: (activity: DailyActivity[]) => void;
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

      // Fetch only if data is stale or forceRefresh is true — delegates to sync engine
      fetchIfStale: async (userId: string, forceRefresh = false) => {
        const { isDataStale, isLoading } = get();

        // Don't fetch if already loading
        if (isLoading) {
          return;
        }

        // Only fetch if stale or forced
        if (forceRefresh || isDataStale(userId)) {
          set({ isLoading: true });
          try {
            await performFullPull(userId);
          } finally {
            set({ isLoading: false });
          }
        }
      },

      fetchStats: async (userId: string) => {
        // Delegate to sync engine via fetchIfStale
        await get().fetchIfStale(userId, true);
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
        set({ isLoading: true });
        try {
          await performFullPull(userId);
          // Also refresh activity from local heatmap after pull
          const activity = useHeatmapStore.getState().getDailyActivity();
          set({ dailyActivity: activity });
        } finally {
          set({ isLoading: false });
        }
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

      updateStatsLocally: (hours: number, grinds: number, streak: number, userId?: string) => {
        set((state) => ({
          totalHours: hours,
          totalGrinds: grinds,
          currentStreak: streak,
          lastFetchedAt: Date.now(), // Mark as fresh since we just updated
          lastFetchedUserId: userId ?? state.lastFetchedUserId,
        }));
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

      // Called by sync engine with DB-authoritative stats
      updateFromRemote: (stats, userId) => {
        set((state) => ({
          totalHours: stats.totalHours,
          totalGrinds: stats.totalGrinds,
          currentStreak: stats.currentStreak,
          lastFetchedAt: Date.now(),
          lastFetchedUserId: userId ?? state.lastFetchedUserId,
        }));
      },

      // Called by sync engine to set dailyActivity from derived heatmap data
      updateDailyActivityFromHeatmap: (activity: DailyActivity[]) => {
        set({ dailyActivity: activity });
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
