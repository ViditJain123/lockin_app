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
import { pushUserProfile, pushTaskUpsert, pushNewBadges } from './syncService';

const MIGRATION_KEY = 'lockin-supabase-data-migration-v1';

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

    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[DataMigration] Migration complete');
  } catch (error) {
    console.error('[DataMigration] Migration failed:', error);
    // Don't mark as complete so it retries next time
  }
}
