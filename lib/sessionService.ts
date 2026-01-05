/**
 * Session Service
 * 
 * Handles recording grind sessions to Supabase.
 * Sessions are stored in the 'grinds' table with metadata only (no video files).
 */

import { supabase } from './supabase';

/**
 * Record a new grind session after a video is saved locally.
 * This stores session metadata in Supabase for heatmap and analytics.
 * 
 * @param userId - The authenticated user's ID
 * @param durationMs - Recording duration in milliseconds
 * @returns true if session was recorded successfully
 */
export async function recordSession(
  userId: string,
  durationMs: number
): Promise<boolean> {
  if (!userId || durationMs <= 0) {
    console.warn('[SessionService] Invalid params:', { userId: !!userId, durationMs });
    return false;
  }

  try {
    const { error } = await supabase.from('grinds').insert({
      user_id: userId,
      duration_ms: durationMs,
      // Video fields left null since we're only storing metadata
      video_path: 'local', // Placeholder to satisfy NOT NULL constraint
      video_url: 'local',  // Placeholder to satisfy NOT NULL constraint
    });

    if (error) {
      console.error('[SessionService] Failed to record session:', error);
      return false;
    }

    console.log('[SessionService] Session recorded:', { userId, durationMs });
    return true;
  } catch (error) {
    console.error('[SessionService] Error recording session:', error);
    return false;
  }
}
