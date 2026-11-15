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
// DEMO DATA:
// - true: Dashboard + stats show generated lock-in / screen-time / heatmap data
//   (dev builds only) so the charts can be previewed filled in.
// - false: Real data only.
// ============================================================
export const DEMO_DATA_ENABLED: boolean = __DEV__ && true;

// ============================================================
// STORIES BACKEND (AWS):
// Both values are printed by `backend/deploy.sh`. While either is empty,
// stories stay on this device only and nothing is uploaded.
// - STORIES_API_URL: the Lambda API that issues upload links
// - STORIES_CDN_URL: where story videos play from (the S3 bucket; CloudFront if enabled)
// ============================================================
export const STORIES_API_URL: string = 'https://cfzhkyjiai.execute-api.ap-south-1.amazonaws.com';
export const STORIES_CDN_URL: string = 'https://lockin-stories-storiesbucket-eq2xoahs2wsv.s3.ap-south-1.amazonaws.com';
