/**
 * Heatmap Refresh
 *
 * Refreshes local heatmap cache from Supabase grinds table.
 * Called on app launch to keep the local heatmap in sync.
 */

import { useHeatmapStore } from '../store/useHeatmapStore';
import { fetchDailyActivity } from './statsService';

/**
 * Refresh heatmap data from Supabase grinds table into local store.
 * This replaces local data with the server-derived data (source of truth).
 */
export async function refreshHeatmapFromSupabase(userId: string): Promise<void> {
  try {
    const supabaseActivity = await fetchDailyActivity(userId, 12);

    if (supabaseActivity.length > 0) {
      useHeatmapStore.getState().importFromSupabase(supabaseActivity);
    }
  } catch (error) {
    console.error('[HeatmapRefresh] Failed to refresh heatmap:', error);
  }
}
