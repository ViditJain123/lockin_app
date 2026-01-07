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
  console.log('[SessionService] recordSession called:', { userId, durationMs });

  if (!userId || durationMs <= 0) {
    console.warn('[SessionService] Invalid params:', { userId: !!userId, durationMs });
    return false;
  }

  try {
    const insertData = {
      user_id: userId,
      duration_ms: durationMs,
      video_path: 'local',
      video_url: 'local',
    };
    console.log('[SessionService] Inserting into grinds:', insertData);

    const { data, error } = await supabase.from('grinds').insert(insertData).select();

    if (error) {
      console.error('[SessionService] Failed to record session:', error.message, error.details, error.hint);
      return false;
    }

    console.log('[SessionService] Session recorded successfully:', data);
    return true;
  } catch (error) {
    console.error('[SessionService] Error recording session:', error);
    return false;
  }
}
