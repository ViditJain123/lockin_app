/**
 * Heatmap Migration
 *
 * One-time migration of existing Supabase heatmap data to local storage.
 * This ensures users don't lose their existing activity history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeatmapStore } from '../store/useHeatmapStore';
import { fetchDailyActivity } from './statsService';

const MIGRATION_KEY = 'lockin-heatmap-migration-complete';

/**
 * Check if migration has been completed
 */
export async function hasMigrationCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MIGRATION_KEY);
  return value === 'true';
}

/**
 * Mark migration as complete
 */
async function markMigrationComplete(): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Migrate existing Supabase heatmap data to local storage.
 * Should be called once when the app updates.
 *
 * @param userId - The user's ID for fetching Supabase data
 */
export async function migrateHeatmapData(userId: string): Promise<void> {
  const alreadyMigrated = await hasMigrationCompleted();
  if (alreadyMigrated) {
    console.log('[HeatmapMigration] Already migrated, skipping');
    return;
  }

  console.log('[HeatmapMigration] Starting migration for user:', userId);

  try {
    // Fetch existing data from Supabase (up to 12 months)
    const supabaseActivity = await fetchDailyActivity(userId, 12);

    if (supabaseActivity.length > 0) {
      // Import into local store
      useHeatmapStore.getState().importFromSupabase(supabaseActivity);
      console.log('[HeatmapMigration] Imported', supabaseActivity.length, 'days of activity');
    } else {
      console.log('[HeatmapMigration] No existing activity to migrate');
    }

    await markMigrationComplete();
    console.log('[HeatmapMigration] Migration complete');
  } catch (error) {
    console.error('[HeatmapMigration] Migration failed:', error);
    // Don't mark as complete so it retries next time
  }
}
