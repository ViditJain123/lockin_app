/**
 * Blocking Service
 *
 * Orchestrates the dynamic blocking and unblocking of apps based on earned screen time.
 * Uses react-native-device-activity to manage iOS Screen Time API.
 *
 * Flow:
 * 1. initializeDailyBlock() - Called at start of day to block all selected apps
 * 2. unblockApps() - Called when user earns time, unblocks apps and starts usage monitoring
 * 3. startUsageMonitoring() - Monitors app usage with a time threshold
 * 4. When threshold reached -> eventDidReachThreshold fires -> removes from whitelist -> apps re-blocked
 */

import {
  blockSelection,
  addSelectionToWhitelistAndUpdateBlock,
  clearWhitelistAndUpdateBlock,
  startMonitoring,
  stopMonitoring,
  configureActions,
  setFamilyActivitySelectionId,
  updateShield,
  isAvailable,
  getAuthorizationStatus,
  AuthorizationStatus,
} from 'react-native-device-activity';
import { Platform } from 'react-native';

// Activity names
const EARNED_TIME_ACTIVITY = 'earnedTimeMonitoring';
const EMERGENCY_PASS_ACTIVITY = 'emergencyPassMonitoring';

// Family activity selection ID for storing the user's blocked apps
const BLOCKED_APPS_SELECTION_ID = 'blockedAppsSelection';

/**
 * Check if device activity (Screen Time API) is available and authorized
 */
export function isBlockingAvailable(): boolean {
  if (Platform.OS !== 'ios' || !isAvailable()) {
    return false;
  }

  // Check if we have authorization
  try {
    const status = getAuthorizationStatus();
    return status === AuthorizationStatus.approved;
  } catch (error) {
    console.log('[BlockingService] Error checking authorization status:', error);
    return false;
  }
}

/**
 * Safely execute a blocking operation with error handling
 */
function safeExecute(operation: () => void, operationName: string): boolean {
  try {
    operation();
    return true;
  } catch (error: any) {
    // Handle common Family Controls errors gracefully
    const errorMessage = error?.message || String(error);
    if (
      errorMessage.includes('helper application') ||
      errorMessage.includes('FamilyControlsAgent') ||
      errorMessage.includes('connection')
    ) {
      console.log(`[BlockingService] ${operationName} skipped - Family Controls not ready`);
    } else {
      console.error(`[BlockingService] Error in ${operationName}:`, error);
    }
    return false;
  }
}

/**
 * Initialize daily blocking - block all selected apps at start of day
 *
 * @param familyActivitySelection - The user's saved app selection string
 */
export function initializeDailyBlock(familyActivitySelection: string | null): void {
  if (!isBlockingAvailable() || !familyActivitySelection) {
    console.log('[BlockingService] Skipping daily block - not available or no selection');
    return;
  }

  try {
    // Stop any existing monitoring
    stopMonitoring([EARNED_TIME_ACTIVITY]);

    // Clear any existing whitelist
    clearWhitelistAndUpdateBlock('dailyReset');

    // Block the user's selected apps
    blockSelection(
      { activitySelectionToken: familyActivitySelection },
      'dailyReset'
    );

    // Store the selection ID for later use
    setFamilyActivitySelectionId({
      id: BLOCKED_APPS_SELECTION_ID,
      familyActivitySelection,
    });

    // Configure the shield appearance with "Need a Break?" secondary button
    updateShield(
      {
        backgroundColor: { red: 0, green: 0, blue: 0, alpha: 0.95 },
        title: 'Time to Grind',
        titleColor: { red: 255, green: 255, blue: 255 },
        subtitle: 'Record a timelapse to earn screen time',
        subtitleColor: { red: 180, green: 180, blue: 180 },
        iconSystemName: 'hourglass',
        iconTint: { red: 255, green: 59, blue: 92 },
        primaryButtonLabel: 'Open LockIn',
        primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
        primaryButtonBackgroundColor: { red: 255, green: 59, blue: 92 },
        secondaryButtonLabel: 'Need a Break?',
      },
      {
        primary: {
          behavior: 'close',
          actions: [{ type: 'openApp' }],
        },
        secondary: {
          behavior: 'close',
          actions: [{ type: 'openUrl' as any, url: 'lockinapp://emergency-access' }],
        },
      }
    );

    console.log('[BlockingService] Daily block initialized successfully');
  } catch (error) {
    console.error('[BlockingService] Error initializing daily block:', error);
  }
}

/**
 * Unblock apps and start usage monitoring
 * Called when user has earned screen time
 *
 * @param familyActivitySelection - The user's saved app selection string
 * @param remainingMinutes - Minutes of screen time remaining
 */
export function unblockApps(
  familyActivitySelection: string | null,
  remainingMinutes: number
): void {
  if (!isBlockingAvailable() || !familyActivitySelection) {
    console.log('[BlockingService] Skipping unblock - not available or no selection');
    return;
  }

  if (remainingMinutes <= 0) {
    console.log('[BlockingService] No remaining time, not unblocking');
    return;
  }

  try {
    // Add the selection to whitelist (this unblocks the apps)
    addSelectionToWhitelistAndUpdateBlock(
      { activitySelectionToken: familyActivitySelection },
      'earnedTimeUnblock'
    );

    // Start monitoring usage with the remaining time as threshold
    startUsageMonitoring(familyActivitySelection, remainingMinutes);

    console.log(`[BlockingService] Apps unblocked with ${remainingMinutes} minutes allowed`);
  } catch (error) {
    console.error('[BlockingService] Error unblocking apps:', error);
  }
}

/**
 * Start device activity monitoring with a time threshold
 * When the threshold is reached, the extension will automatically re-block
 *
 * @param familyActivitySelection - The user's saved app selection string
 * @param thresholdMinutes - Minutes until re-blocking
 */
export function startUsageMonitoring(
  familyActivitySelection: string,
  thresholdMinutes: number
): void {
  if (!isBlockingAvailable()) {
    return;
  }

  try {
    // Stop any existing monitoring first
    stopMonitoring([EARNED_TIME_ACTIVITY]);

    // Configure actions for when threshold is reached
    // This will automatically remove from whitelist and re-block
    configureActions({
      activityName: EARNED_TIME_ACTIVITY,
      callbackName: 'eventDidReachThreshold',
      eventName: 'timeExhausted',
      actions: [
        {
          type: 'clearWhitelistAndUpdateBlock',
        },
        {
          type: 'sendNotification',
          payload: {
            title: 'Screen Time Used Up',
            body: 'Record another timelapse to earn more time!',
            sound: 'default',
          },
        },
      ],
    });

    // Create a schedule that starts now and runs for 24 hours
    const now = new Date();
    const schedule = {
      intervalStart: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      },
      intervalEnd: {
        hour: 23,
        minute: 59,
        second: 59,
      },
      repeats: false,
    };

    // Create an event that fires when the threshold is reached
    const events = [
      {
        familyActivitySelection,
        eventName: 'timeExhausted',
        threshold: {
          minute: thresholdMinutes,
        },
        includesPastActivity: false,
      },
    ];

    // Start monitoring
    startMonitoring(EARNED_TIME_ACTIVITY, schedule, events);

    console.log(`[BlockingService] Usage monitoring started with ${thresholdMinutes} min threshold`);
  } catch (error) {
    console.error('[BlockingService] Error starting usage monitoring:', error);
  }
}

/**
 * Unblock apps without starting a usage monitor (unlimited time).
 * Used when the user has reached their daily grind target.
 *
 * @param familyActivitySelection - The user's saved app selection string
 */
export function unblockAppsUnlimited(
  familyActivitySelection: string | null,
): void {
  if (!isBlockingAvailable() || !familyActivitySelection) {
    console.log('[BlockingService] Skipping unlimited unblock - not available or no selection');
    return;
  }

  try {
    // Stop any existing monitoring
    stopMonitoring([EARNED_TIME_ACTIVITY, EMERGENCY_PASS_ACTIVITY]);

    // Add the selection to whitelist (this unblocks the apps)
    addSelectionToWhitelistAndUpdateBlock(
      { activitySelectionToken: familyActivitySelection },
      'dailyTargetUnlock'
    );

    console.log('[BlockingService] Apps fully unlocked (daily target reached)');
  } catch (error) {
    console.error('[BlockingService] Error in unlimited unblock:', error);
  }
}

/**
 * Unblock apps for emergency access (pass or borrow) with a time limit.
 *
 * @param familyActivitySelection - The user's saved app selection string
 * @param durationMinutes - Minutes of emergency access
 */
export function unblockAppsForEmergency(
  familyActivitySelection: string | null,
  durationMinutes: number,
): void {
  if (!isBlockingAvailable() || !familyActivitySelection) {
    console.log('[BlockingService] Skipping emergency unblock - not available or no selection');
    return;
  }

  if (durationMinutes <= 0) {
    console.log('[BlockingService] Invalid emergency duration');
    return;
  }

  try {
    // Add the selection to whitelist (unblocks the apps)
    addSelectionToWhitelistAndUpdateBlock(
      { activitySelectionToken: familyActivitySelection },
      'emergencyUnblock'
    );

    // Start monitoring with the emergency duration as threshold
    const activityName = EMERGENCY_PASS_ACTIVITY;

    // Stop any existing monitoring first
    stopMonitoring([EARNED_TIME_ACTIVITY, EMERGENCY_PASS_ACTIVITY]);

    // Configure actions for when threshold is reached
    configureActions({
      activityName,
      callbackName: 'eventDidReachThreshold',
      eventName: 'emergencyTimeExhausted',
      actions: [
        {
          type: 'clearWhitelistAndUpdateBlock',
        },
        {
          type: 'sendNotification',
          payload: {
            title: 'Break Time Over',
            body: 'Your emergency access has ended.',
            sound: 'default',
          },
        },
      ],
    });

    const now = new Date();
    const schedule = {
      intervalStart: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      },
      intervalEnd: {
        hour: 23,
        minute: 59,
        second: 59,
      },
      repeats: false,
    };

    const events = [
      {
        familyActivitySelection,
        eventName: 'emergencyTimeExhausted',
        threshold: {
          minute: durationMinutes,
        },
        includesPastActivity: false,
      },
    ];

    startMonitoring(activityName, schedule, events);

    console.log(`[BlockingService] Emergency unblock with ${durationMinutes} min`);
  } catch (error) {
    console.error('[BlockingService] Error in emergency unblock:', error);
  }
}

/**
 * Re-block apps when time is exhausted
 * Called manually or triggered by eventDidReachThreshold
 *
 * @param familyActivitySelection - The user's saved app selection string
 */
export function reblockApps(familyActivitySelection: string | null): void {
  if (!isBlockingAvailable() || !familyActivitySelection) {
    console.log('[BlockingService] Skipping reblock - not available or no selection');
    return;
  }

  try {
    // Stop monitoring
    stopMonitoring([EARNED_TIME_ACTIVITY]);

    // Clear whitelist to re-enable blocking
    clearWhitelistAndUpdateBlock('timeExhausted');

    console.log('[BlockingService] Apps re-blocked after time exhausted');
  } catch (error) {
    console.error('[BlockingService] Error re-blocking apps:', error);
  }
}

/**
 * Stop all monitoring and remove all blocks
 * Used for cleanup or when user disables the feature
 */
export function disableBlocking(): void {
  if (!isBlockingAvailable()) {
    return;
  }

  try {
    stopMonitoring([EARNED_TIME_ACTIVITY]);
    clearWhitelistAndUpdateBlock('disabled');
    console.log('[BlockingService] Blocking disabled');
  } catch (error) {
    console.error('[BlockingService] Error disabling blocking:', error);
  }
}

// Export the activity names for external use
export { EARNED_TIME_ACTIVITY, EMERGENCY_PASS_ACTIVITY, BLOCKED_APPS_SELECTION_ID };
