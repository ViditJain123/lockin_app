import { create } from 'zustand';
import { getLocalDateString } from '../lib/dateUtils';
import {
  DailyActivity,
  fetchUserStats
} from '../lib/statsService';
import { useHeatmapStore } from './useHeatmapStore';

interface ProfileState {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
  dailyActivity: DailyActivity[];
  isLoading: boolean;
  isLoadingActivity: boolean;
  error: string | null;

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  fetchActivity: (userId: string) => Promise<void>;
  refreshAll: (userId: string) => Promise<void>;
  incrementHoursLocally: (additionalHours: number) => void;
  addActivityLocally: (minutes: number) => void;
  resetStats: () => void;
  updateStatsLocally: (hours: number, grinds: number, streak: number) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  totalHours: 0,
  totalGrinds: 0,
  currentStreak: 0,
  dailyActivity: [],
  isLoading: false,
  isLoadingActivity: false,
  error: null,

  fetchStats: async (userId: string) => {
    set({ isLoading: true, error: null });

    const stats = await fetchUserStats(userId);

    if (stats) {
      set({
        totalHours: stats.totalHours,
        totalGrinds: stats.totalGrinds,
        currentStreak: stats.currentStreak,
        isLoading: false,
      });
    } else {
      set({
        error: 'Failed to fetch stats',
        isLoading: false,
      });
    }
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

  // Refresh all profile data (stats and activity)
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
    });
  },

  updateStatsLocally: (hours: number, grinds: number, streak: number) => {
    set({
      totalHours: hours,
      totalGrinds: grinds,
      currentStreak: streak,
    });
  },

  incrementHoursLocally: (additionalHours: number) => {
    set((state) => ({
      totalHours: state.totalHours + additionalHours,
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
        return { dailyActivity: updated };
      }
      // Add new entry for today
      return {
        dailyActivity: [...state.dailyActivity, { date: today, totalMinutes: minutes }],
      };
    });
  },
}));
