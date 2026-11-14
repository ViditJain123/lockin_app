import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { unlockAppsWithTimer, relockApps as relockAppsManager, fullyUnlockApps as fullyUnlockAppsManager } from '../lib/appLockManager';
import { useOnboardingStore } from './useOnboardingStore';
import { useScreenTimeLogStore } from './useScreenTimeLogStore';

// Save the day's spent screen time before counters change or reset
function logUsed(date: string, seconds: number) {
  if (seconds > 0) useScreenTimeLogStore.getState().record(date, seconds);
}

const APP_LOCK_STORAGE_KEY = 'lockin-applock-state';

interface AppLockState {
  // Daily tracking (resets at sleep time)
  earnedScreenTimeSeconds: number;
  usedScreenTimeSeconds: number;
  dailyFocusSeconds: number;
  isFullyUnlocked: boolean;
  isCurrentlyLocked: boolean;
  lastResetDate: string; // YYYY-MM-DD

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Actions
  creditEarnedTime: (sessionSeconds: number) => void;
  unlockApps: () => void;
  relockApps: () => void;
  fullyUnlockApps: () => void;
  lockAppsForSleep: () => void;
  resetDaily: () => void;
  getAvailableScreenTime: () => number;
}

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useAppLockStore = create<AppLockState>()(
  persist(
    (set, get) => ({
      earnedScreenTimeSeconds: 0,
      usedScreenTimeSeconds: 0,
      dailyFocusSeconds: 0,
      isFullyUnlocked: false,
      isCurrentlyLocked: true,
      lastResetDate: getTodayDateStr(),

      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      creditEarnedTime: (sessionSeconds: number) => {
        const { dailyFocusSeconds } = get();
        const earnedFromSession = Math.floor(sessionSeconds / 4);
        const newDailyFocus = dailyFocusSeconds + sessionSeconds;

        const targetHours = useOnboardingStore.getState().quizAnswers.targetHours;
        const targetMet = newDailyFocus >= targetHours * 3600;

        set((state) => ({
          earnedScreenTimeSeconds: state.earnedScreenTimeSeconds + earnedFromSession,
          dailyFocusSeconds: newDailyFocus,
          isFullyUnlocked: targetMet,
        }));

        if (targetMet) {
          get().fullyUnlockApps();
        } else if (!get().isCurrentlyLocked) {
          // Already unlocked — restart monitor with updated total so time accumulates
          const newAvailable = get().getAvailableScreenTime();
          if (newAvailable >= 60) {
            unlockAppsWithTimer(newAvailable);
          }
        }
      },

      unlockApps: () => {
        const available = get().getAvailableScreenTime();
        if (available < 60) return; // Need at least 1 minute

        unlockAppsWithTimer(available);
        set({ isCurrentlyLocked: false });
      },

      relockApps: () => {
        const { earnedScreenTimeSeconds, usedScreenTimeSeconds, isFullyUnlocked } = get();
        if (isFullyUnlocked) return;

        // Mark all earned time as used when re-locked by threshold
        relockAppsManager();
        logUsed(get().lastResetDate, earnedScreenTimeSeconds);
        set({
          isCurrentlyLocked: true,
          usedScreenTimeSeconds: earnedScreenTimeSeconds,
        });
      },

      fullyUnlockApps: () => {
        fullyUnlockAppsManager();
        set({
          isFullyUnlocked: true,
          isCurrentlyLocked: false,
        });
      },

      lockAppsForSleep: () => {
        logUsed(get().lastResetDate, get().usedScreenTimeSeconds);
        set({
          isCurrentlyLocked: true,
          isFullyUnlocked: false,
          earnedScreenTimeSeconds: 0,
          usedScreenTimeSeconds: 0,
          dailyFocusSeconds: 0,
          lastResetDate: getTodayDateStr(),
        });
      },

      resetDaily: () => {
        const today = getTodayDateStr();
        const { lastResetDate } = get();
        if (lastResetDate === today) return;

        logUsed(lastResetDate, get().usedScreenTimeSeconds);
        set({
          earnedScreenTimeSeconds: 0,
          usedScreenTimeSeconds: 0,
          dailyFocusSeconds: 0,
          isFullyUnlocked: false,
          lastResetDate: today,
        });
      },

      getAvailableScreenTime: () => {
        const { earnedScreenTimeSeconds, usedScreenTimeSeconds } = get();
        return Math.max(0, earnedScreenTimeSeconds - usedScreenTimeSeconds);
      },
    }),
    {
      name: APP_LOCK_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        earnedScreenTimeSeconds: state.earnedScreenTimeSeconds,
        usedScreenTimeSeconds: state.usedScreenTimeSeconds,
        dailyFocusSeconds: state.dailyFocusSeconds,
        isFullyUnlocked: state.isFullyUnlocked,
        isCurrentlyLocked: state.isCurrentlyLocked,
        lastResetDate: state.lastResetDate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
