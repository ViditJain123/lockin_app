import { supabase } from './supabase';

export interface UserStats {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
  lastGrindAt: string | null;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
}

export interface GrindItem {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_ms: number;
  created_at: string;
}

/**
 * Fetch user stats from the database
 */
export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('total_hours, total_grinds, current_streak, last_grind_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No stats found, return default values
      return {
        totalHours: 0,
        totalGrinds: 0,
        currentStreak: 0,
        lastGrindAt: null,
      };
    }
    console.error('[StatsService] Error fetching user stats:', error);
    return null;
  }

  return {
    totalHours: Number(data.total_hours) || 0,
    totalGrinds: data.total_grinds || 0,
    currentStreak: data.current_streak || 0,
    lastGrindAt: data.last_grind_at,
  };
}

/**
 * Initialize stats for a new user (called on first upload)
 */
export async function initializeUserStats(userId: string): Promise<boolean> {
  const { error } = await supabase.from('user_stats').insert({
    user_id: userId,
    total_hours: 0,
    total_grinds: 0,
    current_streak: 0,
    last_grind_at: null,
  });

  if (error) {
    // Ignore duplicate key error (user already has stats)
    if (error.code === '23505') {
      return true;
    }
    console.error('[StatsService] Error initializing user stats:', error);
    return false;
  }

  return true;
}

/**
 * Calculate if streak should continue or reset
 */
function calculateNewStreak(lastGrindAt: string | null, currentStreak: number): number {
  if (!lastGrindAt) {
    // First recording ever
    return 1;
  }

  const lastGrindTime = new Date(lastGrindAt).getTime();
  const now = Date.now();
  const hoursSinceLastGrind = (now - lastGrindTime) / (1000 * 60 * 60);

  if (hoursSinceLastGrind <= 24) {
    // Within 24 hours - continue streak
    return currentStreak + 1;
  } else {
    // Streak broken - reset to 1 (today counts)
    return 1;
  }
}

/**
 * Update user stats after a successful upload
 */
export async function updateStatsAfterUpload(
  userId: string,
  durationSeconds: number
): Promise<boolean> {
  // First, try to get current stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_stats')
    .select('total_hours, total_grinds, current_streak, last_grind_at')
    .eq('user_id', userId)
    .single();

  const hoursToAdd = durationSeconds / 3600;

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No stats exist - create new record
      const newStreak = 1;
      const { error: insertError } = await supabase.from('user_stats').insert({
        user_id: userId,
        total_hours: hoursToAdd,
        total_grinds: 1,
        current_streak: newStreak,
        last_grind_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[StatsService] Error creating user stats:', insertError);
        return false;
      }
      return true;
    }
    console.error('[StatsService] Error fetching stats for update:', fetchError);
    return false;
  }

  // Calculate new values
  const newTotalHours = Number(existingStats.total_hours) + hoursToAdd;
  const newTotalGrinds = existingStats.total_grinds + 1;
  const newStreak = calculateNewStreak(
    existingStats.last_grind_at,
    existingStats.current_streak
  );

  // Update stats
  const { error: updateError } = await supabase
    .from('user_stats')
    .update({
      total_hours: newTotalHours,
      total_grinds: newTotalGrinds,
      current_streak: newStreak,
      last_grind_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('[StatsService] Error updating user stats:', updateError);
    return false;
  }

  return true;
}

/**
 * Fetch daily activity data for heatmap display
 * Returns activity grouped by date for the specified number of months
 */
export async function fetchDailyActivity(
  userId: string,
  months: number = 6
): Promise<DailyActivity[]> {
  // Calculate the start date (X months ago)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('grinds')
    .select('created_at, duration_ms')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[StatsService] Error fetching daily activity:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group recordings by date and sum durations
  const activityMap = new Map<string, number>();

  data.forEach((grind) => {
    // Extract just the date part (YYYY-MM-DD)
    const date = new Date(grind.created_at).toISOString().split('T')[0];
    const durationMinutes = (grind.duration_ms || 0) / (1000 * 60);

    const existing = activityMap.get(date) || 0;
    activityMap.set(date, existing + durationMinutes);
  });

  // Convert map to array
  const result: DailyActivity[] = [];
  activityMap.forEach((totalMinutes, date) => {
    result.push({ date, totalMinutes });
  });

  return result;
}

/**
 * Fetch user grinds with pagination for gallery display
 */
export async function fetchUserGrinds(
  userId: string,
  limit: number = 12,
  offset: number = 0
): Promise<{ grinds: GrindItem[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('grinds')
    .select('id, video_url, thumbnail_url, duration_ms, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error('[StatsService] Error fetching user grinds:', error);
    return { grinds: [], hasMore: false };
  }

  if (!data) {
    return { grinds: [], hasMore: false };
  }

  // If we got more items than limit, there are more to load
  const hasMore = data.length > limit;
  const grinds = hasMore ? data.slice(0, limit) : data;

  return { grinds, hasMore };
}
