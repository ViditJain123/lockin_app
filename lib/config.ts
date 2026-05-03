/**
 * App Configuration
 *
 * Central configuration file for development toggles and app settings.
 */

// ============================================================
// ONBOARDING DEV MODE OPTIONS:
// - 'skip': Skip onboarding, go directly to auth/main appN
// - 'force': Always show onboarding (ignores completion state)
// - 'normal': Production behavior (show onboarding only if not completed)
// ============================================================
export const ONBOARDING_DEV_MODE: 'skip' | 'force' | 'normal' = 'normal';

// ============================================================
// NOTIFICATION DEV MODE:
// - true: Schedules 5 test notifications at 10-second intervals with varied message categories (works in ALL builds including TestFlight)
// - false: Use production 24-hour re-engagement cycle (30 daily notifications)
// ============================================================
export const NOTIFICATION_DEV_MODE_ENABLED: boolean = false;

// ============================================================
// SESSION DEV MODE:
// - true: Shows a "Dev" button next to the record button that simulates a 4-minute session
// - false: Production behavior (no dev button)
// ============================================================
export const SESSION_DEV_MODE_ENABLED: boolean = false;

// ============================================================
// ATTRIBUTION DEV MODE:
// - true: Bypasses fingerprint matching, logs all attribution events to console
// - false: Production behavior (normal fingerprint-based deferred matching)
// ============================================================
export const ATTRIBUTION_DEV_MODE: boolean = false;

// ============================================================
// PAYWALL SIGN OUT BUTTON:
// - true: Shows a "Sign Out" button at the bottom of the hard paywall screen
// - false: Hides the sign out button (users must subscribe to proceed)
// ============================================================
export const PAYWALL_SIGN_OUT_ENABLED: boolean = false;
