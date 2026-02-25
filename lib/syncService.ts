/**
 * Sync Service
 *
 * Centralized push/pull functions for syncing local Zustand stores
 * with Supabase. Pattern: remote-first with local cache fallback.
 */

import { supabase } from './supabase';
import { QuizAnswers } from '../store/useOnboardingStore';
import { Task } from '../store/useTaskStore';
import { EarnedBadge } from '../store/useBadgeStore';

// ─── Profile ───────────────────────────────────────────────

export async function pullUserProfile(userId: string): Promise<QuizAnswers | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No row
    console.error('[SyncService] pullUserProfile error:', error);
    return null;
  }

  return {
    name: data.name ?? '',
    goals: data.goals ?? [],
    screenTime: Number(data.screen_time_hours) || 4,
    desiredScreenTime: Number(data.desired_screen_time_hours) || 2,
    problematicApps: data.problematic_apps ?? [],
    age: data.age ?? '',
    sleepTime: data.sleep_time ?? { hour: 10, minute: 0, period: 'PM' },
    familyActivitySelection: data.family_activity_selection ?? null,
    targetHours: Number(data.target_hours) || 4,
  };
}

export async function pushUserProfile(userId: string, profile: QuizAnswers): Promise<boolean> {
  const row = {
    user_id: userId,
    name: profile.name,
    goals: profile.goals,
    screen_time_hours: profile.screenTime,
    desired_screen_time_hours: profile.desiredScreenTime,
    problematic_apps: profile.problematicApps,
    age: profile.age,
    sleep_time: profile.sleepTime,
    family_activity_selection: profile.familyActivitySelection,
    target_hours: profile.targetHours,
    has_completed_onboarding: true,
  };

  const { error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    console.error('[SyncService] pushUserProfile error:', error);
    return false;
  }
  return true;
}

// ─── Tasks ─────────────────────────────────────────────────

export async function pullUserTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[SyncService] pullUserTasks error:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    isDaily: row.is_daily ?? false,
    isCompleted: row.is_completed ?? false,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
  }));
}

export async function pushTaskUpsert(userId: string, task: Task): Promise<boolean> {
  const { error } = await supabase
    .from('user_tasks')
    .upsert({
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      is_daily: task.isDaily,
      is_completed: task.isCompleted,
      created_at: task.createdAt,
      completed_at: task.completedAt,
    }, { onConflict: 'user_id,id' });

  if (error) {
    console.error('[SyncService] pushTaskUpsert error:', error);
    return false;
  }
  return true;
}

export async function pushTaskDelete(userId: string, taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('id', taskId);

  if (error) {
    console.error('[SyncService] pushTaskDelete error:', error);
    return false;
  }
  return true;
}

/**
 * Batch sync for resetForNewDay:
 * - Delete completed one-time tasks
 * - Reset daily tasks to uncompleted
 */
export async function pushTasksResetForNewDay(
  userId: string,
  completedOneTimeIds: string[],
  dailyTaskIds: string[]
): Promise<boolean> {
  try {
    // Delete completed one-time tasks
    if (completedOneTimeIds.length > 0) {
      const { error: delError } = await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', userId)
        .in('id', completedOneTimeIds);

      if (delError) {
        console.error('[SyncService] pushTasksResetForNewDay delete error:', delError);
        return false;
      }
    }

    // Reset daily tasks
    if (dailyTaskIds.length > 0) {
      const { error: updateError } = await supabase
        .from('user_tasks')
        .update({ is_completed: false, completed_at: null })
        .eq('user_id', userId)
        .in('id', dailyTaskIds);

      if (updateError) {
        console.error('[SyncService] pushTasksResetForNewDay update error:', updateError);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('[SyncService] pushTasksResetForNewDay error:', err);
    return false;
  }
}

// ─── Badges ────────────────────────────────────────────────

export async function pullUserBadges(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[SyncService] pullUserBadges error:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    badgeId: row.badge_id,
    earnedAt: row.earned_at,
  }));
}

export async function pushNewBadges(userId: string, badges: EarnedBadge[]): Promise<boolean> {
  if (badges.length === 0) return true;

  const rows = badges.map((b) => ({
    user_id: userId,
    badge_id: b.badgeId,
    earned_at: b.earnedAt,
  }));

  const { error } = await supabase
    .from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });

  if (error) {
    console.error('[SyncService] pushNewBadges error:', error);
    return false;
  }
  return true;
}
