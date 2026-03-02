/**
 * Earned Time Store
 *
 * Zustand store for tracking earned screen time from timelapse recordings.
 * Uses a fixed 4:1 conversion rate with target-based daily unlock.
 *
 * - Before hitting daily target: 4:1 rate (1 min grind = 15 sec screen time)
 * - After hitting daily target: apps fully unlocked for rest of day
 * - Resets daily at midnight (local timezone)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';
import { calculateEarnedSeconds } from '../lib/earnedTimeUtils';

// Storage key
const EARNED_TIME_STORAGE_KEY = 'lockin-earned-time-state';

interface EarnedTimeState {
  // State
  earnedTimeToday: number; // seconds earned from timelapse recordings
  usedTimeToday: number; // seconds consumed by app usage
  totalGrindSecondsToday: number; // raw grind seconds recorded today (not converted)
  lastResetDate: string; // YYYY-MM-DD for daily reset tracking
  lastMonitoringStartedAt: number | null; // timestamp when current monitor session started

  // Hydration state
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  addEarnedTime: (grindSeconds: number) => number;
  addEarnedTimeRaw: (seconds: number) => void;
  addGrindSeconds: (grindSeconds: number) => void;
  consumeTime: (seconds: number) => void;
  markTimeExhausted: () => void;
  setMonitoringStartedAt: (timestamp: number) => void;
  isTimeExhausted: () => boolean;
  checkAndResetForNewDay: () => boolean;
  getRemainingTimeSeconds: () => number;
  getRemainingTimeMinutes: () => number;
  hasReachedDailyTarget: (targetHours: number) => boolean;

  // Reset all earned time state (used on logout for data isolation)
  resetEarnedTime: () => void;
}

export const useEarnedTimeStore = create<EarnedTimeState>()(
  persist(
    (set, get) => ({
      earnedTimeToday: 0,
      usedTimeToday: 0,
      totalGrindSecondsToday: 0,
      lastResetDate: getLocalDateString(),
      lastMonitoringStartedAt: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      /**
       * Add earned time from a timelapse recording at fixed 4:1 rate
       *
       * @param grindSeconds - Duration of the productive work in seconds
       * @returns The number of screen time seconds earned
       */
      addEarnedTime: (grindSeconds: number) => {
        // First check for new day
        get().checkAndResetForNewDay();

        const earnedSeconds = calculateEarnedSeconds(grindSeconds);

        set((state) => ({
          earnedTimeToday: state.earnedTimeToday + earnedSeconds,
        }));

        console.log(
          `[EarnedTimeStore] Added ${earnedSeconds}s earned time from ${grindSeconds}s grind at 4:1 rate`
        );

        return earnedSeconds;
      },

      /**
       * Add pre-computed earned seconds directly (for debt remainder)
       *
       * @param seconds - Pre-computed screen time seconds to add
       */
      addEarnedTimeRaw: (seconds: number) => {
        if (seconds <= 0) return;

        get().checkAndResetForNewDay();

        set((state) => ({
          earnedTimeToday: state.earnedTimeToday + seconds,
        }));

        console.log(`[EarnedTimeStore] Added ${seconds}s raw earned time`);
      },

      /**
       * Track grind seconds toward daily target (separate from earned time conversion)
       *
       * @param grindSeconds - Raw grind seconds to add
       */
      addGrindSeconds: (grindSeconds: number) => {
        get().checkAndResetForNewDay();

        set((state) => ({
          totalGrindSecondsToday: state.totalGrindSecondsToday + grindSeconds,
        }));

        console.log(
          `[EarnedTimeStore] Added ${grindSeconds}s grind toward daily target (total: ${get().totalGrindSecondsToday}s)`
        );
      },

      /**
       * Consume earned time when using blocked apps
       */
      consumeTime: (seconds: number) => {
        get().checkAndResetForNewDay();

        set((state) => ({
          usedTimeToday: state.usedTimeToday + seconds,
        }));

        console.log(`[EarnedTimeStore] Consumed ${seconds}s of screen time`);
      },

      /**
       * Mark all earned time as consumed (called when iOS monitor fires threshold event)
       */
      markTimeExhausted: () => {
        const { earnedTimeToday } = get();
        set({ usedTimeToday: earnedTimeToday });
        console.log(`[EarnedTimeStore] Time exhausted, usedTimeToday set to ${earnedTimeToday}s`);
      },

      /**
       * Record when monitoring begins (for correlating iOS threshold events)
       */
      setMonitoringStartedAt: (timestamp: number) => {
        set({ lastMonitoringStartedAt: timestamp });
      },

      /**
       * Check if all earned time has been consumed
       */
      isTimeExhausted: () => {
        const { earnedTimeToday, usedTimeToday } = get();
        return earnedTimeToday > 0 && usedTimeToday >= earnedTimeToday;
      },

      /**
       * Check if it's a new day and reset counters if needed
       */
      checkAndResetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDate } = get();

        if (today !== lastResetDate) {
          console.log(`[EarnedTimeStore] New day detected (${lastResetDate} -> ${today}), resetting counters`);
          set({
            earnedTimeToday: 0,
            usedTimeToday: 0,
            totalGrindSecondsToday: 0,
            lastResetDate: today,
            lastMonitoringStartedAt: null,
          });
          return true;
        }

        return false;
      },

      /**
       * Get remaining screen time in seconds (never negative)
       */
      getRemainingTimeSeconds: () => {
        const { earnedTimeToday, usedTimeToday } = get();
        return Math.max(0, earnedTimeToday - usedTimeToday);
      },

      /**
       * Get remaining screen time in minutes (rounded down, never negative)
       */
      getRemainingTimeMinutes: () => {
        const remainingSeconds = get().getRemainingTimeSeconds();
        return Math.floor(remainingSeconds / 60);
      },

      /**
       * Check if user has reached their daily grind target
       *
       * @param targetHours - The user's daily target in hours
       */
      hasReachedDailyTarget: (targetHours: number) => {
        const targetSeconds = targetHours * 3600;
        return get().totalGrindSecondsToday >= targetSeconds;
      },

      resetEarnedTime: () => {
        set({
          earnedTimeToday: 0,
          usedTimeToday: 0,
          totalGrindSecondsToday: 0,
          lastResetDate: getLocalDateString(),
          lastMonitoringStartedAt: null,
        });
      },
    }),
    {
      name: EARNED_TIME_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        earnedTimeToday: state.earnedTimeToday,
        usedTimeToday: state.usedTimeToday,
        totalGrindSecondsToday: state.totalGrindSecondsToday,
        lastResetDate: state.lastResetDate,
        lastMonitoringStartedAt: state.lastMonitoringStartedAt,
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
export const useTotalGrindSecondsToday = () => useEarnedTimeStore((s) => s.totalGrindSecondsToday);
export const useRemainingTimeMinutes = () => {
  const earned = useEarnedTimeStore((s) => s.earnedTimeToday);
  const used = useEarnedTimeStore((s) => s.usedTimeToday);
  return Math.floor(Math.max(0, earned - used) / 60);
};
export const useHasEarnedTimeHydrated = () => useEarnedTimeStore((s) => s._hasHydrated);
