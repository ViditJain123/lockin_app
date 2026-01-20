/**
 * Date Utilities for Local Timezone Handling
 *
 * IMPORTANT: All date strings in this app should use LOCAL timezone
 * to ensure activities are attributed to the correct user calendar day.
 */

/**
 * Get a date string in YYYY-MM-DD format using LOCAL timezone
 * This is the correct way to get today's date for activity tracking.
 *
 * Example: If it's 11 PM on Jan 15th in India (IST), this returns "2024-01-15"
 * (NOT "2024-01-16" which toISOString() would give due to UTC conversion)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object at midnight local time
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get date string for N days ago in local timezone
 */
export function getLocalDateStringDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
}

/**
 * Get the user's timezone name (for debugging)
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
