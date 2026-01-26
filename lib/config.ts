/**
 * App Configuration
 *
 * Central configuration file for development toggles and app settings.
 */

// ============================================================
// ONBOARDING DEV MODE OPTIONS:
// - 'skip': Skip onboarding, go directly to auth/main app
// - 'force': Always show onboarding (ignores completion state)
// - 'normal': Production behavior (show onboarding only if not completed)
// ============================================================
export const ONBOARDING_DEV_MODE: 'skip' | 'force' | 'normal' = 'skip';

// ============================================================
// NOTIFICATION DEV MODE:
// - true: Use short 1-minute test notifications in __DEV__ mode
// - false: Use production 6-hour reminders even in __DEV__ mode
// ============================================================
export const NOTIFICATION_DEV_MODE_ENABLED: boolean = true;
