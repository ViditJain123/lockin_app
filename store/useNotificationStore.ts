/**
 * Notification Store
 *
 * Zustand store for managing notification state with AsyncStorage persistence.
 * Tracks last grind timestamp and notification preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cancelGrindReminderNotification,
  scheduleGrindReminderNotification,
} from '../lib/notificationService';

// Time constants
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000; // 6 hours

interface NotificationState {
  // State
  lastGrindTimestamp: number | null;
  hasNotificationPermission: boolean;
  isNotificationEnabled: boolean;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (hydrated: boolean) => void;
  updateLastGrindTimestamp: () => void;
  setHasNotificationPermission: (hasPermission: boolean) => void;
  setIsNotificationEnabled: (isEnabled: boolean) => void;
  checkAndScheduleReminder: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      lastGrindTimestamp: null,
      hasNotificationPermission: false,
      isNotificationEnabled: true, // Enabled by default
      _hasHydrated: false,

      // Hydration tracker
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      // Update timestamp when user completes a grind
      updateLastGrindTimestamp: () => {
        const now = Date.now();
        set({ lastGrindTimestamp: now });
        console.log('[NotificationStore] Updated last grind timestamp:', new Date(now).toISOString());
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

        // If disabling, cancel any pending reminders
        if (!isEnabled) {
          cancelGrindReminderNotification();
        }
      },

      // Check time since last grind and schedule reminder if needed
      checkAndScheduleReminder: async () => {
        const state = get();

        // Don't schedule if notifications are disabled or no permission
        if (!state.isNotificationEnabled || !state.hasNotificationPermission) {
          console.log('[NotificationStore] Skipping reminder - notifications disabled or no permission');
          return;
        }

        const now = Date.now();
        const lastGrind = state.lastGrindTimestamp;

        // If no previous grind recorded, schedule for 6 hours from now
        if (lastGrind === null) {
          console.log('[NotificationStore] No previous grind - scheduling reminder for 6 hours');
          await scheduleGrindReminderNotification();
          return;
        }

        const timeSinceLastGrind = now - lastGrind;

        // If more than 6 hours since last grind, schedule reminder
        if (timeSinceLastGrind >= SIX_HOURS_IN_MS) {
          console.log('[NotificationStore] More than 6 hours since last grind - scheduling reminder');
          await scheduleGrindReminderNotification();
        } else {
          console.log('[NotificationStore] Less than 6 hours since last grind - no reminder needed');
          // Cancel any existing reminder since user recently grinded
          await cancelGrindReminderNotification();
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastGrindTimestamp: state.lastGrindTimestamp,
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
export const useLastGrindTimestamp = () => useNotificationStore((s) => s.lastGrindTimestamp);
export const useHasNotificationPermission = () => useNotificationStore((s) => s.hasNotificationPermission);
export const useIsNotificationEnabled = () => useNotificationStore((s) => s.isNotificationEnabled);
