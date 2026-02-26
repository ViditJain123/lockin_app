/**
 * Heatmap Store
 *
 * Zustand store for managing local heatmap activity data.
 * Uses AsyncStorage for persistence and local timezone for dates.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';
import { DailyActivity } from '../lib/statsService';

const HEATMAP_STORAGE_KEY = 'lockin-heatmap-activity';

interface HeatmapState {
  // Activity data: date (YYYY-MM-DD local) -> total minutes
  activityByDate: Record<string, number>;
  version: number;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  addMinutes: (minutes: number, date?: Date) => void;
  getDailyActivity: () => DailyActivity[];
  clearActivity: () => void;

  // Called by sync engine after conflict resolution (max-per-date merge)
  updateFromRemote: (activityByDate: Record<string, number>) => void;
}

export const useHeatmapStore = create<HeatmapState>()(
  persist(
    (set, get) => ({
      activityByDate: {},
      version: 1,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      /**
       * Add minutes to a specific date (defaults to today in LOCAL timezone)
       */
      addMinutes: (minutes: number, date?: Date) => {
        const dateStr = getLocalDateString(date);
        set((state) => ({
          activityByDate: {
            ...state.activityByDate,
            [dateStr]: (state.activityByDate[dateStr] || 0) + minutes,
          },
        }));
      },

      /**
       * Get activity data in the DailyActivity[] format expected by ActivityHeatmap
       */
      getDailyActivity: (): DailyActivity[] => {
        const { activityByDate } = get();
        return Object.entries(activityByDate).map(([date, totalMinutes]) => ({
          date,
          totalMinutes,
        }));
      },

      /**
       * Called by sync engine with resolved (max-per-date) heatmap data
       */
      updateFromRemote: (activityByDate: Record<string, number>) => {
        set({ activityByDate });
      },

      /**
       * Clear all activity (for testing/reset)
       */
      clearActivity: () => {
        set({ activityByDate: {} });
      },
    }),
    {
      name: HEATMAP_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activityByDate: state.activityByDate,
        version: state.version,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks
export const useHeatmapActivity = () => useHeatmapStore((state) => state.getDailyActivity());
export const useHasHeatmapHydrated = () => useHeatmapStore((state) => state._hasHydrated);
