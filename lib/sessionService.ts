/**
 * Session Service
 *
 * Handles recording grind sessions to Supabase.
 * Sessions are stored in the 'grinds' table with metadata only (no video files).
 */

import { supabase } from './supabase';

/**
 * Record a new grind session after a video is saved locally.
 * Uses upsert with the local grind ID so retries are idempotent.
 *
 * @param userId - The authenticated user's ID
 * @param durationMs - Recording duration in milliseconds
 * @param grindId - The local video/grind UUID (used as the row ID for idempotent upsert)
 * @returns true if session was recorded successfully
 */
export async function recordSession(
  userId: string,
  durationMs: number,
  grindId: string
): Promise<boolean> {
  console.log('[SessionService] recordSession called:', { userId, durationMs, grindId });

  if (!userId || durationMs <= 0 || !grindId) {
    console.warn('[SessionService] Invalid params:', { userId: !!userId, durationMs, grindId: !!grindId });
    return false;
  }

  try {
    const upsertData = {
      id: grindId,
      user_id: userId,
      duration_ms: durationMs,
      video_path: 'local',
      video_url: 'local',
    };
    console.log('[SessionService] Upserting into grinds:', upsertData);

    const { data, error } = await supabase
      .from('grinds')
      .upsert(upsertData, { onConflict: 'id' })
      .select();

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
