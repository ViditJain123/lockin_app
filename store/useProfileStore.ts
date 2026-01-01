import { create } from 'zustand';
import {
  fetchUserStats,
  UserStats,
  fetchDailyActivity,
  DailyActivity,
  fetchUserGrinds,
  GrindItem,
} from '../lib/statsService';

interface ProfileState {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
  dailyActivity: DailyActivity[];
  isLoading: boolean;
  isLoadingActivity: boolean;
  error: string | null;

  // Gallery state
  grinds: GrindItem[];
  isLoadingGrinds: boolean;
  hasMoreGrinds: boolean;
  grindsOffset: number;

  // Actions
  fetchStats: (userId: string) => Promise<void>;
  fetchActivity: (userId: string) => Promise<void>;
  fetchGrinds: (userId: string, loadMore?: boolean) => Promise<void>;
  resetStats: () => void;
  resetGrinds: () => void;
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

  // Gallery initial state
  grinds: [],
  isLoadingGrinds: false,
  hasMoreGrinds: true,
  grindsOffset: 0,

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

  fetchActivity: async (userId: string) => {
    set({ isLoadingActivity: true });

    const activity = await fetchDailyActivity(userId, 6);

    set({
      dailyActivity: activity,
      isLoadingActivity: false,
    });
  },

  fetchGrinds: async (userId: string, loadMore: boolean = false) => {
    const { isLoadingGrinds, hasMoreGrinds, grindsOffset, grinds } = get();

    // Prevent duplicate loads
    if (isLoadingGrinds) return;

    // Don't load more if there's nothing left
    if (loadMore && !hasMoreGrinds) return;

    set({ isLoadingGrinds: true });

    const offset = loadMore ? grindsOffset : 0;
    const { grinds: newGrinds, hasMore } = await fetchUserGrinds(userId, 12, offset);

    set({
      grinds: loadMore ? [...grinds, ...newGrinds] : newGrinds,
      hasMoreGrinds: hasMore,
      grindsOffset: offset + newGrinds.length,
      isLoadingGrinds: false,
    });
  },

  resetGrinds: () => {
    set({
      grinds: [],
      isLoadingGrinds: false,
      hasMoreGrinds: true,
      grindsOffset: 0,
    });
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
}));
