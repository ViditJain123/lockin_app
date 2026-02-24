/**
 * Earned Time Utilities
 *
 * Shared conversion math for the target-based unlock system.
 * Fixed 4:1 conversion rate: 1 min grind = 15 sec screen time.
 */

export const CONVERSION_RATE = 4; // 4:1 — 1 min grind = 15 sec screen time

/**
 * Convert grind seconds to earned screen time seconds at fixed 4:1 rate.
 *
 * @param grindSeconds - Seconds of productive work recorded
 * @returns Seconds of screen time earned
 */
export function calculateEarnedSeconds(grindSeconds: number): number {
  return Math.round(grindSeconds / CONVERSION_RATE);
}
