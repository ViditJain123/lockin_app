import {
  resetBlocks,
  blockSelection,
  startMonitoring,
  stopMonitoring,
  configureActions,
  getFamilyActivitySelectionId,
} from 'react-native-device-activity';

const USAGE_MONITOR = 'usageCountdown';

export function unlockAppsWithTimer(availableSeconds: number) {
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
  );
}

export function relockApps() {
  stopMonitoring([USAGE_MONITOR]);
  blockSelection({ activitySelectionId: 'onboardingSelection' }, 'appLockRelock');
}

export function fullyUnlockApps() {
  stopMonitoring([USAGE_MONITOR]);
  resetBlocks('appLockFullUnlock');
}
