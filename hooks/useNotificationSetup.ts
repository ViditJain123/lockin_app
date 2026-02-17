/**
 * Notification Setup Hook
 *
 * Hook for app layout that handles notification initialization,
 * permission requests, and AppState changes for the 24-hour
 * re-engagement notification cycle.
 *
 * Development mode: Schedules 5 test notifications at 10-second intervals
 * Production mode: Schedules 30-day re-engagement cycle on background
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NOTIFICATION_DEV_MODE_ENABLED } from '../lib/config';
import {
  initializeNotifications,
  requestNotificationPermission,
  scheduleDevReengagementNotifications,
} from '../lib/notificationService';
import { useNotificationStore } from '../store/useNotificationStore';
import { useVideoStore } from '../store/useVideoStore';

export function useNotificationSetup() {
  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  const {
    _hasHydrated,
    hasNotificationPermission,
    isNotificationEnabled,
    setHasNotificationPermission,
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

      if (NOTIFICATION_DEV_MODE_ENABLED) {
        // Dev mode: schedule test notifications on launch
        console.log('[NotificationSetup] DEV mode - scheduling test notifications');
        await scheduleDevReengagementNotifications();
      } else {
        // Production mode: record app open, cancel old, schedule new
        const store = useNotificationStore.getState();
        store.checkPermanentSilence();
        store.recordAppOpen();
        await store.cancelReengagementCycle();
        await store.scheduleReengagementCycle();
      }
    }

    setup();
  }, [setHasNotificationPermission]);

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
      // Dev mode behavior
      if (nextAppState === 'background') {
        console.log('[NotificationSetup] DEV: App backgrounded - scheduling test notifications');
        await scheduleDevReengagementNotifications();
      } else if (nextAppState === 'active' && previousState !== 'active') {
        console.log('[NotificationSetup] DEV: App foregrounded - cancelling test notifications');
        await useNotificationStore.getState().cancelReengagementCycle();
      }
    } else {
      // Production mode behavior
      if (nextAppState === 'active' && previousState !== 'active') {
        // User came back — record app open, cancel pending notifications (cycle resets)
        console.log('[NotificationSetup] PROD: App foregrounded - cancelling cycle');
        const store = useNotificationStore.getState();
        store.checkPermanentSilence();
        store.recordAppOpen();
        await store.cancelReengagementCycle();
      } else if (nextAppState === 'background') {
        // User left — schedule re-engagement cycle (30 daily notifications starting 24h from now)
        console.log('[NotificationSetup] PROD: App backgrounded - scheduling cycle');
        await useNotificationStore.getState().scheduleReengagementCycle();
      }
    }
  }

  // Migration: existing users who already have videos should be enrolled
  const videoStoreInitialized = useVideoStore((s) => s.isInitialized);
  const videos = useVideoStore((s) => s.videos);
  const hasEverRecorded = useNotificationStore((s) => s.hasEverRecorded);

  useEffect(() => {
    if (videoStoreInitialized && !hasEverRecorded && videos.length > 0) {
      console.log('[NotificationSetup] Migration: existing user has videos, setting hasEverRecorded');
      useNotificationStore.getState().setHasEverRecorded();
    }
  }, [videoStoreInitialized, hasEverRecorded, videos.length]);
}
