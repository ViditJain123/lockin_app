import {
  startMonitoring,
  stopMonitoring,
  configureActions,
} from 'react-native-device-activity';

const SLEEP_TIME_ACTIVITY = 'sleepTimeLock';

export function scheduleSleepTimeLock(sleepHour24: number, sleepMinute: number) {
  // Stop any existing sleep time monitoring
  stopMonitoring([SLEEP_TIME_ACTIVITY]);

  // Configure action: when sleep time interval starts, block selected apps
  configureActions({
    activityName: SLEEP_TIME_ACTIVITY,
    callbackName: 'intervalDidStart',
    actions: [
      {
        type: 'blockSelection',
        familyActivitySelectionId: 'onboardingSelection',
      },
      {
        type: 'sendNotification',
        payload: {
          title: 'Apps Locked',
          body: 'Time to wind down. Lock in tomorrow to earn screen time!',
        },
      },
    ],
  });

  // Schedule repeating daily at sleep time
  // intervalStart = sleep time, intervalEnd = 1 hour later (iOS minimum)
  const endMinute = sleepMinute;
  const endHour = (sleepHour24 + 1) % 24;

  startMonitoring(
    SLEEP_TIME_ACTIVITY,
    {
      intervalStart: { hour: sleepHour24, minute: sleepMinute, second: 0 },
      intervalEnd: { hour: endHour, minute: endMinute, second: 0 },
      repeats: true,
    },
    []
  );
}

export function cancelSleepTimeLock() {
  stopMonitoring([SLEEP_TIME_ACTIVITY]);
}
