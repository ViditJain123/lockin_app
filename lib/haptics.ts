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
