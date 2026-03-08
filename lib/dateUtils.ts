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

/**
 * Get the Monday of the week containing the given date (local timezone)
 */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // day 0 = Sunday -> go back 6 days; day 1 = Monday -> 0; day 2 = Tue -> 1, etc.
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Get the Sunday of the week containing the given date (local timezone)
 */
export function getWeekEndDate(date: Date): Date {
  const start = getWeekStartDate(date);
  start.setDate(start.getDate() + 6);
  return start;
}

/**
 * Get the first day of the month for the given date (local timezone)
 */
export function getMonthStartDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get the last day of the month for the given date (local timezone)
 */
export function getMonthEndDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
}

/**
 * Get an array of YYYY-MM-DD strings for every day between start and end (inclusive)
 */
export function getDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current <= endNorm) {
    dates.push(getLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Get tomorrow's date string in YYYY-MM-DD format using LOCAL timezone
 */
export function getTomorrowDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getLocalDateString(date);
}

/**
 * Format a date range for display: "Feb 17 - Feb 23"
 */
export function formatDateRange(start: Date, end: Date): string {
  const formatShort = (d: Date) => {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${d.getDate()}`;
  };
  return `${formatShort(start)} - ${formatShort(end)}`;
}
