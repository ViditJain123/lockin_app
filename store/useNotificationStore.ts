/**
 * Notification Store
 *
 * Zustand store for managing the 24-hour re-engagement notification cycle.
 * Tracks whether the user has ever recorded, app open timestamps,
 * cycle state, and permanent silence after 30 days of inactivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cancelAllReengagementNotifications,
  scheduleReengagementNotifications,
} from '../lib/notificationService';
import { useProfileStore } from './useProfileStore';

// 30 days in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface NotificationState {
  // State
  hasEverRecorded: boolean;
  lastAppOpenTimestamp: number | null;
  cycleStartTimestamp: number | null;
  isPermanentlySilenced: boolean;
  hasNotificationPermission: boolean;
  isNotificationEnabled: boolean;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (hydrated: boolean) => void;
  setHasEverRecorded: () => void;
  recordAppOpen: () => void;
  scheduleReengagementCycle: () => Promise<void>;
  cancelReengagementCycle: () => Promise<void>;
  checkPermanentSilence: () => void;
  setHasNotificationPermission: (hasPermission: boolean) => void;
  setIsNotificationEnabled: (isEnabled: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasEverRecorded: false,
      lastAppOpenTimestamp: null,
      cycleStartTimestamp: null,
      isPermanentlySilenced: false,
      hasNotificationPermission: false,
      isNotificationEnabled: true,
      _hasHydrated: false,

      // Hydration tracker
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      // One-way flag: set when user saves their first video (never goes back to false)
      setHasEverRecorded: () => {
        if (!get().hasEverRecorded) {
          set({ hasEverRecorded: true });
          console.log('[NotificationStore] hasEverRecorded set to true');
        }
      },

      // Record when user opens/foregrounds the app, reset cycle start
      recordAppOpen: () => {
        const now = Date.now();
        set({
          lastAppOpenTimestamp: now,
          cycleStartTimestamp: now,
        });
        console.log('[NotificationStore] Recorded app open:', new Date(now).toISOString());
      },

      // Schedule the 30-day re-engagement notification cycle
      scheduleReengagementCycle: async () => {
        const state = get();

        // Guard: user must have recorded at least once
        if (!state.hasEverRecorded) {
          console.log('[NotificationStore] Skipping cycle - user has never recorded');
          return;
        }

        // Guard: notifications must be enabled and permitted
        if (!state.isNotificationEnabled || !state.hasNotificationPermission) {
          console.log('[NotificationStore] Skipping cycle - notifications disabled or no permission');
          return;
        }

        // Guard: check permanent silence
        if (state.isPermanentlySilenced) {
          console.log('[NotificationStore] Skipping cycle - permanently silenced');
          return;
        }

        // Check if we should be permanently silenced
        if (state.cycleStartTimestamp && (Date.now() - state.cycleStartTimestamp) >= THIRTY_DAYS_MS) {
          set({ isPermanentlySilenced: true });
          console.log('[NotificationStore] Permanently silenced - 30 days exceeded');
          return;
        }

        // Get current streak from profile store
        const currentStreak = useProfileStore.getState().currentStreak;

        await scheduleReengagementNotifications(currentStreak);
        console.log('[NotificationStore] Re-engagement cycle scheduled (streak:', currentStreak, ')');
      },

      // Cancel all pending re-engagement notifications
      cancelReengagementCycle: async () => {
        await cancelAllReengagementNotifications();
        console.log('[NotificationStore] Re-engagement cycle cancelled');
      },

      // Check if 30+ days have passed since cycle start → permanent silence
      checkPermanentSilence: () => {
        const state = get();
        if (state.cycleStartTimestamp && (Date.now() - state.cycleStartTimestamp) >= THIRTY_DAYS_MS) {
          set({ isPermanentlySilenced: true });
          console.log('[NotificationStore] Permanent silence activated - 30+ days since cycle start');
        }
      },

      // Set permission status
      setHasNotificationPermission: (hasPermission) => {
        set({ hasNotificationPermission: hasPermission });
        console.log('[NotificationStore] Permission status updated:', hasPermission);
      },

      // Toggle notification preference
      setIsNotificationEnabled: (isEnabled) => {
        set({ isNotificationEnabled: isEnabled });
        console.log('[NotificationStore] Notifications enabled:', isEnabled);

        if (!isEnabled) {
          cancelAllReengagementNotifications();
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasEverRecorded: state.hasEverRecorded,
        lastAppOpenTimestamp: state.lastAppOpenTimestamp,
        cycleStartTimestamp: state.cycleStartTimestamp,
        isPermanentlySilenced: state.isPermanentlySilenced,
        hasNotificationPermission: state.hasNotificationPermission,
        isNotificationEnabled: state.isNotificationEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        console.log('[NotificationStore] Hydrated from storage');
      },
    }
  )
);

// Selector hooks
export const useHasEverRecorded = () => useNotificationStore((s) => s.hasEverRecorded);
export const useHasNotificationPermission = () => useNotificationStore((s) => s.hasNotificationPermission);
export const useIsNotificationEnabled = () => useNotificationStore((s) => s.isNotificationEnabled);
