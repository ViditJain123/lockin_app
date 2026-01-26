/**
 * Notification Service
 *
 * Handles scheduling and managing local notifications for grind reminders.
 * In development mode, notifications fire 1 minute after launch/backgrounding.
 * In production, reminders fire if user hasn't recorded a grind in 6 hours.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Notification identifiers
const GRIND_REMINDER_ID = 'grind-reminder';
const DEV_TEST_ID = 'dev-test-notification';

// Time constants
const SIX_HOURS_IN_SECONDS = 6 * 60 * 60; // 6 hours
const DEV_TEST_SECONDS = 60; // 1 minute for dev testing

// Randomized notification messages
const NOTIFICATION_MESSAGES = [
  {
    title: "Time to Lock In!",
    body: "Hey, you haven't been locked in for a while. Time to get back to it!",
  },
  {
    title: "You're Slacking Off!",
    body: "Get locked in and make progress on your goals.",
  },
  {
    title: "Break's Over!",
    body: "6 hours without grinding? Let's change that.",
  },
];

/**
 * Get a random notification message
 */
function getRandomMessage() {
  const index = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[index];
}

/**
 * Initialize notifications - set up handlers and Android channels
 */
export async function initializeNotifications(): Promise<void> {
  // Configure how notifications are handled when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('grind-reminders', {
      name: 'Grind Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  // Set up notification response handler (when user taps notification)
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Notifications] User tapped notification:', response.notification.request.identifier);
    // Deep link to camera screen (main tab)
    router.replace('/(tabs)');
  });

  console.log('[Notifications] Initialized');
}

/**
 * Request notification permissions
 * @returns true if permissions were granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';
  console.log('[Notifications] Permission status:', finalStatus);

  return granted;
}

/**
 * Schedule the grind reminder notification (6 hours - production)
 */
export async function scheduleGrindReminderNotification(): Promise<void> {
  // Cancel any existing reminder first
  await cancelGrindReminderNotification();

  const message = getRandomMessage();

  await Notifications.scheduleNotificationAsync({
    identifier: GRIND_REMINDER_ID,
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'grind-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SIX_HOURS_IN_SECONDS,
    },
  });

  console.log('[Notifications] Scheduled grind reminder for 6 hours from now');
}

/**
 * Cancel pending grind reminder notification
 */
export async function cancelGrindReminderNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(GRIND_REMINDER_ID);
  console.log('[Notifications] Cancelled grind reminder');
}

/**
 * Schedule a dev test notification (for testing in development)
 * @param seconds - Number of seconds until notification fires (default: 60)
 */
export async function scheduleDevTestNotification(seconds: number = DEV_TEST_SECONDS): Promise<void> {
  // Cancel any existing dev test notification first
  await cancelDevTestNotification();

  const message = getRandomMessage();

  await Notifications.scheduleNotificationAsync({
    identifier: DEV_TEST_ID,
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'grind-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  console.log(`[Notifications] Scheduled dev test notification for ${seconds} seconds from now`);
}

/**
 * Cancel pending dev test notification
 */
export async function cancelDevTestNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DEV_TEST_ID);
  console.log('[Notifications] Cancelled dev test notification');
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('[Notifications] Scheduled notifications:', scheduled.map(n => n.identifier));
  return scheduled;
}
