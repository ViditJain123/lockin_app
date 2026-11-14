import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback utilities for consistent UX throughout the app.
 * Uses semantic function names to make it clear when each type should be used.
 */

/**
 * Medium impact feedback for continue buttons and primary actions.
 * Use this for main CTA buttons throughout the onboarding flow.
 */
export function buttonPress(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Light impact feedback for option selection.
 * Use this when selecting quiz options, toggles, or secondary actions.
 */
export function optionSelect(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Selection feedback for slider changes.
 * Use this for discrete slider value changes (e.g., screen time hours).
 */
export function sliderTick(): void {
  Haptics.selectionAsync();
}

/**
 * Medium impact feedback for animation completion reveals.
 * Use this when key animations complete to draw attention to results.
 */
export function animationReveal(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy impact feedback for starting a focus session.
 */
export function sessionStart(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Success notification feedback for stopping a session and saving timelapse.
 */
export function sessionStop(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Heavy thud as the mascot lands on the opening screen.
 */
export function mascotLand(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Soft tap timed with the mascot's wink.
 */
export function mascotWink(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

// ── Session choreography ────────────────────────────────────────────────────
// Haptic patterns for starting, running and ending a lock-in. Each pairs with a
// sound cue from lib/sound.ts.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Countdown 3-2-1: taps get heavier as zero approaches. */
export function countdownTick(n: number): void {
  const style =
    n >= 3
      ? Haptics.ImpactFeedbackStyle.Light
      : n === 2
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy;
  Haptics.impactAsync(style);
}

/** The "lock" engaging: a heavy clunk, a rigid latch, then a success buzz. */
export async function lockInPattern(): Promise<void> {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await wait(70);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  await wait(140);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Ticks while holding the stop button; called with 0..1 progress. */
export function holdTick(progress: number): void {
  Haptics.impactAsync(
    progress < 0.5 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
  );
}

/** Gentle pulse every few minutes of focus, so you feel time banked. */
export function milestonePulse(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

/** Daily goal hit mid-session. */
export async function goalReachedPattern(): Promise<void> {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await wait(180);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await wait(110);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Session saved: unlatch and a success buzz. */
export async function unlockPattern(): Promise<void> {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  await wait(90);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** You left the app during a phone-down session. */
export function awayWarning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
