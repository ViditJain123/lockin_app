/**
 * Notification Service
 *
 * Handles scheduling and managing local notifications for the 24-hour
 * re-engagement cycle. Sends daily notifications for up to 30 days
 * after the user last opened the app, with context-aware messages
 * based on day number and streak.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Maximum number of re-engagement notifications in a cycle
const MAX_REENGAGEMENT_DAYS = 30;

// Dev mode: number of test notifications and interval
const DEV_NOTIFICATION_COUNT = 5;
const DEV_INTERVAL_SECONDS = 10;

// 24 hours in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// --- Message Catalog ---

interface NotificationMessage {
  title: string;
  body: string;
}

// Category 1 — General (day 1, no streak)
const GENERAL_MESSAGES: NotificationMessage[] = [
  { title: 'Time to focus', body: 'One distraction-free grind can change the day' },
  { title: 'Start a timelapse', body: "You don't need to feel ready. Just start." },
  { title: 'Good morning!', body: 'Start your day with a work session' },
];

// Category 2 — Streak (day 1, streak > 0, dynamic values)
const STREAK_MESSAGES: ((streak: number) => NotificationMessage)[] = [
  (n) => ({ title: 'Streak active', body: `You've locked in ${n} days straight. Keep it alive.` }),
  (_n) => ({ title: "Don't break it", body: 'One session protects your streak' }),
  (n) => ({ title: 'Consistency wins', body: `Start your Day ${n} with this session` }),
];

// Category 3 — Re-engagement (days 2–6)
const REENGAGEMENT_MESSAGES: NotificationMessage[] = [
  { title: 'Yesterday slipped', body: 'Today is still yours. Lock in.' },
  { title: 'No guilt, just action', body: 'Restart with one focused session.' },
  { title: 'Get back on track', body: 'Progress is one lockin away.' },
  { title: 'Pause is okay', body: "Quitting isn't. Start again." },
];

// Category 4 — Tough Love (days 7–30)
const TOUGH_LOVE_MESSAGES: NotificationMessage[] = [
  { title: 'Be honest', body: 'Were you about to procrastinate?' },
  { title: 'This is the moment', body: 'Most people stop here.' },
  { title: 'Decide now', body: 'Lock in or stay the same.' },
];

/**
 * Select a notification message based on day number and current streak.
 * Day 1 with streak > 0 → streak messages
 * Day 1 with no streak → general messages
 * Days 2-6 → re-engagement messages
 * Days 7-30 → tough love messages
 */
export function selectMessageForDay(dayNumber: number, currentStreak: number): NotificationMessage {
  if (dayNumber === 1) {
    if (currentStreak > 0) {
      const index = Math.floor(Math.random() * STREAK_MESSAGES.length);
      return STREAK_MESSAGES[index](currentStreak);
    }
    const index = Math.floor(Math.random() * GENERAL_MESSAGES.length);
    return GENERAL_MESSAGES[index];
  }

  if (dayNumber >= 2 && dayNumber <= 6) {
    const index = Math.floor(Math.random() * REENGAGEMENT_MESSAGES.length);
    return REENGAGEMENT_MESSAGES[index];
  }

  // Days 7-30
  const index = Math.floor(Math.random() * TOUGH_LOVE_MESSAGES.length);
  return TOUGH_LOVE_MESSAGES[index];
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

  // Create Android notification channel (new name)
  if (Platform.OS === 'android') {
    // Delete old channel if it exists
    try {
      await Notifications.deleteNotificationChannelAsync('grind-reminders');
    } catch (_e) {
      // Channel may not exist, that's fine
    }

    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  // Set up notification response handler (when user taps notification)
  Notifications.addNotificationResponseReceivedListener((response) => {
    const identifier = response.notification.request.identifier;
    const userInfo = response.notification.request.content.data;
    console.log('[Notifications] User tapped notification:', identifier);

    if (userInfo?.screen === 'emergency-access') {
      router.push('/emergency-access');
      return;
    }

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
 * Schedule up to 30 re-engagement notifications using DATE triggers.
 * Each notification fires exactly day * 24h from now.
 * @param currentStreak - The user's current streak at scheduling time
 */
export async function scheduleReengagementNotifications(currentStreak: number): Promise<void> {
  // Cancel any existing re-engagement notifications first
  await cancelAllReengagementNotifications();

  const now = Date.now();

  for (let day = 1; day <= MAX_REENGAGEMENT_DAYS; day++) {
    const message = selectMessageForDay(day, currentStreak);
    const fireDate = new Date(now + day * TWENTY_FOUR_HOURS_MS);

    await Notifications.scheduleNotificationAsync({
      identifier: `reengagement-${day}`,
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'daily-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  }

  console.log(`[Notifications] Scheduled ${MAX_REENGAGEMENT_DAYS} re-engagement notifications (streak: ${currentStreak})`);
}

/**
 * Cancel all re-engagement notifications (identifiers reengagement-1 through reengagement-30)
 */
export async function cancelAllReengagementNotifications(): Promise<void> {
  const cancelPromises: Promise<void>[] = [];
  for (let day = 1; day <= MAX_REENGAGEMENT_DAYS; day++) {
    cancelPromises.push(
      Notifications.cancelScheduledNotificationAsync(`reengagement-${day}`)
    );
  }
  await Promise.all(cancelPromises);
  console.log('[Notifications] Cancelled all re-engagement notifications');
}

/**
 * Dev mode: schedule 5 notifications at 10-second intervals with varied category messages
 */
export async function scheduleDevReengagementNotifications(): Promise<void> {
  await cancelAllReengagementNotifications();

  // Cancel dev-specific identifiers too
  for (let i = 1; i <= DEV_NOTIFICATION_COUNT; i++) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`reengagement-${i}`);
    } catch (_e) {
      // Ignore
    }
  }

  const now = Date.now();

  // Schedule 5 notifications showing different categories
  const devDays = [1, 1, 3, 5, 10]; // Triggers different categories: general/streak, general/streak, reengagement, reengagement, tough love
  const devStreak = 3; // Use a non-zero streak to show streak messages

  for (let i = 0; i < DEV_NOTIFICATION_COUNT; i++) {
    const dayNumber = devDays[i];
    const message = selectMessageForDay(dayNumber, devStreak);
    const fireDate = new Date(now + (i + 1) * DEV_INTERVAL_SECONDS * 1000);

    await Notifications.scheduleNotificationAsync({
      identifier: `reengagement-${i + 1}`,
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'daily-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    console.log(`[Notifications] DEV: Scheduled #${i + 1} (day ${dayNumber}) at +${(i + 1) * DEV_INTERVAL_SECONDS}s: "${message.title}"`);
  }

  console.log(`[Notifications] DEV: Scheduled ${DEV_NOTIFICATION_COUNT} test notifications at ${DEV_INTERVAL_SECONDS}s intervals`);
}

/**
 * Schedule a daily 6am reminder to plan tasks
 */
export async function scheduleDailyTaskReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-tasks-reminder');
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-tasks-reminder',
    content: {
      title: 'Plan your day',
      body: 'Set your tasks and lock in',
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'daily-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 6,
      minute: 0,
    },
  });
  console.log('[Notifications] Scheduled daily 6am task reminder');
}

/**
 * Cancel the daily task reminder
 */
export async function cancelDailyTaskReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-tasks-reminder');
  console.log('[Notifications] Cancelled daily task reminder');
}

/**
 * Schedule a notification 24 hours before trial expiration
 * @param expirationDateISO - ISO string of the trial expiration date
 */
export async function scheduleTrialEndNotification(expirationDateISO: string): Promise<void> {
  await cancelTrialEndNotification();

  const expirationDate = new Date(expirationDateISO);
  const fireDate = new Date(expirationDate.getTime() - TWENTY_FOUR_HOURS_MS);

  // Only schedule if the fire date is in the future
  if (fireDate.getTime() <= Date.now()) {
    console.log('[Notifications] Trial end notification fire date is in the past, skipping');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'trial-ending-soon',
    content: {
      title: 'Your free trial ends tomorrow',
      body: 'Subscribe to keep using LockIn.',
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'daily-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });

  console.log('[Notifications] Scheduled trial-ending-soon notification for', fireDate.toISOString());
}

/**
 * Cancel any pending trial end notification
 */
export async function cancelTrialEndNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('trial-ending-soon');
  console.log('[Notifications] Cancelled trial-ending-soon notification');
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('[Notifications] Scheduled notifications:', scheduled.map(n => n.identifier));
  return scheduled;
}
