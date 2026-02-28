/**
 * Data Migration
 *
 * One-time migration of existing local data to Supabase for users
 * who already have local data but nothing server-side.
 * Called once on app launch after auth, before regular sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useTaskStore } from '../store/useTaskStore';
import { useBadgeStore } from '../store/useBadgeStore';
import { useVideoStore } from '../store/useVideoStore';
import { pushUserProfile, pushTaskUpsert, pushNewBadges } from './syncService';
import { recordSession } from './sessionService';
import { recalculateStatsFromGrinds } from './statsService';
import { getAllVideos } from './videoStorageService';

const MIGRATION_KEY = 'lockin-supabase-data-migration-v1';
const GRINDS_MIGRATION_KEY = 'lockin-grinds-backfill-v1';

export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_KEY);
  if (done === 'true') return;

  console.log('[DataMigration] Starting one-time migration for user:', userId);

  try {
    // 1. Push onboarding profile if completed locally
    const onboarding = useOnboardingStore.getState();
    if (onboarding.hasCompletedOnboarding) {
      await pushUserProfile(userId, onboarding.quizAnswers);
      console.log('[DataMigration] Pushed profile');
    }

    // 2. Push all local tasks
    const tasks = useTaskStore.getState().tasks;
    if (tasks.length > 0) {
      await Promise.all(tasks.map((task) => pushTaskUpsert(userId, task)));
      console.log('[DataMigration] Pushed', tasks.length, 'tasks');
    }

    // 3. Push all local badges
    const badges = useBadgeStore.getState().earnedBadges;
    if (badges.length > 0) {
      await pushNewBadges(userId, badges);
      console.log('[DataMigration] Pushed', badges.length, 'badges');
    }

    // Heatmap doesn't need migration — it pulls from grinds table

    // 4. Backfill grinds table from local videos
    await backfillGrindsFromVideos(userId);

    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[DataMigration] Migration complete');
  } catch (error) {
    console.error('[DataMigration] Migration failed:', error);
    // Don't mark as complete so it retries next time
  }
}

/**
 * Backfill the grinds table and user_stats from local videos.
 * Uses its own key so it can also be called independently for users
 * who already passed the v1 migration but have empty grinds.
 */
export async function backfillGrindsFromVideos(userId: string): Promise<void> {
  const done = await AsyncStorage.getItem(GRINDS_MIGRATION_KEY);
  if (done === 'true') return;

  let videos = useVideoStore.getState().videos;
  // Fallback: load directly from disk if store isn't populated yet
  if (videos.length === 0) {
    videos = await getAllVideos();
  }
  if (videos.length === 0) {
    await AsyncStorage.setItem(GRINDS_MIGRATION_KEY, 'true');
    return;
  }

  console.log('[DataMigration] Backfilling', videos.length, 'videos to grinds table');

  try {
    // Insert each video as a grind session (using video ID as grind ID for idempotency)
    for (const video of videos) {
      await recordSession(userId, video.durationSeconds * 1000, video.id);
    }

    // Recalculate stats from all grinds (idempotent)
    await recalculateStatsFromGrinds(userId);

    await AsyncStorage.setItem(GRINDS_MIGRATION_KEY, 'true');
    console.log('[DataMigration] Grinds backfill complete');
  } catch (error) {
    console.error('[DataMigration] Grinds backfill failed:', error);
    // Don't mark as complete so it retries next time
  }
}
