/**
 * Notification Setup Hook
 *
 * Hook for app layout that handles notification initialization,
 * permission requests, and AppState changes for scheduling.
 *
 * Development mode: Schedules test notifications 1 minute after launch/background
 * Production mode: Schedules reminders based on last grind timestamp
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NOTIFICATION_DEV_MODE_ENABLED } from '../lib/config';
import {
  initializeNotifications,
  requestNotificationPermission,
  scheduleDevTestNotification,
  cancelDevTestNotification,
} from '../lib/notificationService';
import { useNotificationStore } from '../store/useNotificationStore';

export function useNotificationSetup() {
  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  const {
    _hasHydrated,
    hasNotificationPermission,
    isNotificationEnabled,
    setHasNotificationPermission,
    checkAndScheduleReminder,
  } = useNotificationStore();

  // Initialize notifications on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    async function setup() {
      // Initialize notification handlers and channels
      await initializeNotifications();

      // Request permission
      const granted = await requestNotificationPermission();
      setHasNotificationPermission(granted);

      if (!granted) {
        console.log('[NotificationSetup] Permission not granted - notifications disabled');
        return;
      }

      // If dev mode enabled, schedule a test notification on launch (works in ALL builds including TestFlight)
      if (NOTIFICATION_DEV_MODE_ENABLED) {
        console.log('[NotificationSetup] DEV mode - scheduling test notification (1 min)');
        await scheduleDevTestNotification(60); // 1 minute
      } else {
        // Production mode - check if we should schedule a reminder
        await checkAndScheduleReminder();
      }
    }

    setup();
  }, [setHasNotificationPermission, checkAndScheduleReminder]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!_hasHydrated) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [_hasHydrated, hasNotificationPermission, isNotificationEnabled]);

  async function handleAppStateChange(nextAppState: AppStateStatus) {
    const previousState = appState.current;
    appState.current = nextAppState;

    console.log('[NotificationSetup] App state changed:', previousState, '->', nextAppState);

    // Skip if notifications are disabled or no permission
    if (!hasNotificationPermission || !isNotificationEnabled) {
      return;
    }

    if (NOTIFICATION_DEV_MODE_ENABLED) {
      // Dev mode behavior - test notifications (works in ALL builds including TestFlight)
      if (nextAppState === 'background') {
        // App went to background - schedule test notification
        console.log('[NotificationSetup] DEV: App backgrounded - scheduling test notification (1 min)');
        await scheduleDevTestNotification(60);
      } else if (nextAppState === 'active' && previousState !== 'active') {
        // App came to foreground - cancel pending test notification
        console.log('[NotificationSetup] DEV: App foregrounded - cancelling test notification');
        await cancelDevTestNotification();
      }
    } else {
      // Production mode behavior - 6-hour reminders
      if (nextAppState === 'background') {
        // App went to background - check and schedule reminder if needed
        console.log('[NotificationSetup] PROD: App backgrounded - checking reminder');
        await useNotificationStore.getState().checkAndScheduleReminder();
      } else if (nextAppState === 'active' && previousState !== 'active') {
        // App came to foreground - could refresh state if needed
        console.log('[NotificationSetup] PROD: App foregrounded');
      }
    }
  }
}
