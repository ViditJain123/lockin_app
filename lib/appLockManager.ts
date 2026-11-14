import { Platform } from 'react-native';
import {
  resetBlocks,
  blockSelection,
  startMonitoring,
  stopMonitoring,
  configureActions,
  getFamilyActivitySelectionId,
} from 'react-native-device-activity';

const USAGE_MONITOR = 'usageCountdown';

// Android has no FamilyControls equivalent; the underlying package logs
// "Only available on iOS" on every call. Bail early so Android logs stay
// quiet and we don't waste cycles in no-op bridge hops.
const isIOS = Platform.OS === 'ios';

export function unlockAppsWithTimer(availableSeconds: number) {
  if (!isIOS) return;
  // 1. Remove shields
  resetBlocks('appLockUnlock');

  // 2. Set up usage-based re-lock
  stopMonitoring([USAGE_MONITOR]);

  const selectionToken = getFamilyActivitySelectionId('onboardingSelection');
  if (!selectionToken) return;

  // Configure re-lock action when threshold reached
  configureActions({
    activityName: USAGE_MONITOR,
    callbackName: 'eventDidReachThreshold',
    eventName: 'usageExpired',
    actions: [
      {
        type: 'blockSelection',
        familyActivitySelectionId: 'onboardingSelection',
      },
      {
        type: 'sendNotification',
        payload: {
          title: 'Screen Time Over',
          body: 'Lock in to earn more!',
        },
      },
    ],
  });

  // Monitor usage with threshold = available seconds
  const thresholdMinutes = Math.floor(availableSeconds / 60);
  const thresholdSeconds = availableSeconds % 60;

  // Rejects when Screen Time (FamilyControls) is not authorised, e.g. on the
  // simulator or if the user revoked it — never let that surface as a crash.
  Promise.resolve(
    startMonitoring(
      USAGE_MONITOR,
      {
        intervalStart: { hour: 0, minute: 0, second: 0 },
        intervalEnd: { hour: 23, minute: 59, second: 59 },
        repeats: false,
      },
      [
        {
          eventName: 'usageExpired',
          familyActivitySelection: selectionToken,
          threshold: { minute: thresholdMinutes, second: thresholdSeconds },
          includesPastActivity: false,
        },
      ]
    )
  ).catch((e) => console.warn('[AppLock] startMonitoring failed:', e?.message ?? e));
}

export function relockApps() {
  if (!isIOS) return;
  stopMonitoring([USAGE_MONITOR]);
  blockSelection({ activitySelectionId: 'onboardingSelection' }, 'appLockRelock');
}

export function fullyUnlockApps() {
  if (!isIOS) return;
  stopMonitoring([USAGE_MONITOR]);
  resetBlocks('appLockFullUnlock');
}
