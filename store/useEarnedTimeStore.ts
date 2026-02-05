/**
 * Earned Time Store
 *
 * Zustand store for tracking earned screen time from timelapse recordings.
 * Time is earned by recording productive timelapses and consumed by using blocked apps.
 * Resets daily at midnight (local timezone).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';
import { ConversionRate } from './useOnboardingStore';

// Storage key
const EARNED_TIME_STORAGE_KEY = 'lockin-earned-time-state';

interface EarnedTimeState {
  // State
  earnedTimeToday: number; // seconds earned from timelapse recordings
  usedTimeToday: number; // seconds consumed by app usage
  lastResetDate: string; // YYYY-MM-DD for daily reset tracking

  // Hydration state
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  addEarnedTime: (grindSeconds: number, conversionRate: ConversionRate) => number;
  consumeTime: (seconds: number) => void;
  checkAndResetForNewDay: () => boolean;
  getRemainingTimeSeconds: () => number;
  getRemainingTimeMinutes: () => number;
}

/**
 * Convert grind time to earned screen time based on conversion rate
 *
 * @param grindMinutes - Minutes of productive work recorded
 * @param conversionRate - The conversion rate setting
 * @returns Minutes of screen time earned
 */
function calculateEarnedMinutes(grindMinutes: number, conversionRate: ConversionRate): number {
  switch (conversionRate) {
    case '6:1':
      return grindMinutes / 6;
    case '4:1':
      return grindMinutes / 4;
    case '3:1':
      return grindMinutes / 3;
    default:
      return grindMinutes / 4; // Default to balanced
  }
}

export const useEarnedTimeStore = create<EarnedTimeState>()(
  persist(
    (set, get) => ({
      earnedTimeToday: 0,
      usedTimeToday: 0,
      lastResetDate: getLocalDateString(),
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      /**
       * Add earned time from a timelapse recording
       *
       * @param grindSeconds - Duration of the productive work in seconds
       * @param conversionRate - The user's conversion rate setting
       * @returns The number of screen time seconds earned
       */
      addEarnedTime: (grindSeconds: number, conversionRate: ConversionRate) => {
        // First check for new day
        get().checkAndResetForNewDay();

        const grindMinutes = grindSeconds / 60;
        const earnedMinutes = calculateEarnedMinutes(grindMinutes, conversionRate);
        const earnedSeconds = Math.round(earnedMinutes * 60);

        set((state) => ({
          earnedTimeToday: state.earnedTimeToday + earnedSeconds,
        }));

        console.log(
          `[EarnedTimeStore] Added ${earnedSeconds}s (${earnedMinutes.toFixed(1)}min) earned time from ${grindSeconds}s grind with ${conversionRate} rate`
        );

        return earnedSeconds;
      },

      /**
       * Consume earned time when using blocked apps
       *
       * @param seconds - Number of seconds to consume
       */
      consumeTime: (seconds: number) => {
        // First check for new day
        get().checkAndResetForNewDay();

        set((state) => ({
          usedTimeToday: state.usedTimeToday + seconds,
        }));

        console.log(`[EarnedTimeStore] Consumed ${seconds}s of screen time`);
      },

      /**
       * Check if it's a new day and reset counters if needed
       *
       * @returns true if counters were reset (new day), false otherwise
       */
      checkAndResetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDate } = get();

        if (today !== lastResetDate) {
          console.log(`[EarnedTimeStore] New day detected (${lastResetDate} -> ${today}), resetting counters`);
          set({
            earnedTimeToday: 0,
            usedTimeToday: 0,
            lastResetDate: today,
          });
          return true;
        }

        return false;
      },

      /**
       * Get remaining screen time in seconds
       *
       * @returns Remaining seconds (never negative)
       */
      getRemainingTimeSeconds: () => {
        const { earnedTimeToday, usedTimeToday } = get();
        return Math.max(0, earnedTimeToday - usedTimeToday);
      },

      /**
       * Get remaining screen time in minutes (rounded down)
       *
       * @returns Remaining minutes (never negative)
       */
      getRemainingTimeMinutes: () => {
        const remainingSeconds = get().getRemainingTimeSeconds();
        return Math.floor(remainingSeconds / 60);
      },
    }),
    {
      name: EARNED_TIME_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        earnedTimeToday: state.earnedTimeToday,
        usedTimeToday: state.usedTimeToday,
        lastResetDate: state.lastResetDate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Check for new day on rehydration
        state?.checkAndResetForNewDay();
      },
    }
  )
);

// Selector hooks for common use cases
export const useEarnedTimeToday = () => useEarnedTimeStore((s) => s.earnedTimeToday);
export const useUsedTimeToday = () => useEarnedTimeStore((s) => s.usedTimeToday);
export const useRemainingTimeMinutes = () => {
  const earned = useEarnedTimeStore((s) => s.earnedTimeToday);
  const used = useEarnedTimeStore((s) => s.usedTimeToday);
  return Math.floor(Math.max(0, earned - used) / 60);
};
export const useHasEarnedTimeHydrated = () => useEarnedTimeStore((s) => s._hasHydrated);
