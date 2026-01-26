import { supabase } from './supabase';
import { getLocalDateString, getLocalDateStringDaysAgo } from './dateUtils';

export interface UserStats {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
  lastGrindAt: string | null;
  streakEarnedDate: string | null;       // YYYY-MM-DD when streak was last earned
  todayAccumulatedHours: number;          // hours accumulated today toward 1-hour goal
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
}

/**
 * Fetch user stats from the database
 */
export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('total_hours, total_grinds, current_streak, last_grind_at, streak_earned_date, today_accumulated_hours')
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
        streakEarnedDate: null,
        todayAccumulatedHours: 0,
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
    streakEarnedDate: data.streak_earned_date || null,
    todayAccumulatedHours: Number(data.today_accumulated_hours) || 0,
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
    streak_earned_date: null,
    today_accumulated_hours: 0,
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

interface StreakCalculationResult {
  newStreak: number;
  newStreakEarnedDate: string | null;
  newTodayAccumulatedHours: number;
}

/**
 * Calculate streak update based on calendar days and 1-hour minimum requirement.
 *
 * Rules:
 * - Streak only increments once per calendar day
 * - User must record at least 1 hour total that day to qualify
 * - Multiple recordings in same day add to hours but don't increment streak
 */
function calculateStreakUpdate(
  currentStreak: number,
  streakEarnedDate: string | null,
  todayAccumulatedHours: number,
  additionalHours: number
): StreakCalculationResult {
  const today = getLocalDateString();
  const yesterday = getLocalDateStringDaysAgo(1);

  // Already earned streak today? Just accumulate hours
  if (streakEarnedDate === today) {
    return {
      newStreak: currentStreak,
      newStreakEarnedDate: today,
      newTodayAccumulatedHours: todayAccumulatedHours + additionalHours,
    };
  }

  // Different day - reset accumulation and start fresh
  const newTodayHours = additionalHours;

  // Check if we hit the 1-hour threshold
  if (newTodayHours < 1.0) {
    // Not yet qualified - keep streak if yesterday earned, else reset to 0
    if (streakEarnedDate === yesterday) {
      return {
        newStreak: currentStreak,
        newStreakEarnedDate: streakEarnedDate,
        newTodayAccumulatedHours: newTodayHours,
      };
    } else {
      // Streak broken - reset to 0 (haven't earned today yet)
      return {
        newStreak: 0,
        newStreakEarnedDate: streakEarnedDate,
        newTodayAccumulatedHours: newTodayHours,
      };
    }
  }

  // Met 1-hour threshold! Award streak
  if (streakEarnedDate === yesterday) {
    // Continue streak from yesterday
    return {
      newStreak: currentStreak + 1,
      newStreakEarnedDate: today,
      newTodayAccumulatedHours: newTodayHours,
    };
  } else {
    // Start new streak (first day or gap in days)
    return {
      newStreak: 1,
      newStreakEarnedDate: today,
      newTodayAccumulatedHours: newTodayHours,
    };
  }
}

/**
 * Update user stats after a successful recording save
 */
export async function updateStatsAfterSave(
  userId: string,
  durationSeconds: number
): Promise<boolean> {
  // First, try to get current stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_stats')
    .select('total_hours, total_grinds, current_streak, last_grind_at, streak_earned_date, today_accumulated_hours')
    .eq('user_id', userId)
    .single();

  const hoursToAdd = durationSeconds / 3600;

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No stats exist - create new record
      // Calculate streak for first recording
      const streakResult = calculateStreakUpdate(0, null, 0, hoursToAdd);

      const { error: insertError } = await supabase.from('user_stats').insert({
        user_id: userId,
        total_hours: hoursToAdd,
        total_grinds: 1,
        current_streak: streakResult.newStreak,
        last_grind_at: new Date().toISOString(),
        streak_earned_date: streakResult.newStreakEarnedDate,
        today_accumulated_hours: streakResult.newTodayAccumulatedHours,
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

  // Calculate new values using calendar-day based streak logic
  const newTotalHours = Number(existingStats.total_hours) + hoursToAdd;
  const newTotalGrinds = existingStats.total_grinds + 1;

  const streakResult = calculateStreakUpdate(
    existingStats.current_streak || 0,
    existingStats.streak_earned_date || null,
    Number(existingStats.today_accumulated_hours) || 0,
    hoursToAdd
  );

  // Update stats
  const { error: updateError } = await supabase
    .from('user_stats')
    .update({
      total_hours: newTotalHours,
      total_grinds: newTotalGrinds,
      current_streak: streakResult.newStreak,
      last_grind_at: new Date().toISOString(),
      streak_earned_date: streakResult.newStreakEarnedDate,
      today_accumulated_hours: streakResult.newTodayAccumulatedHours,
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
 * Reads session metadata from Supabase grinds table
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
 * Record watch time incrementally when video is paused.
 * Updates total_hours in user_stats (does NOT increment grind count).
 */
export async function recordWatchTime(
  userId: string,
  watchedSeconds: number
): Promise<{ success: boolean; newTotalHours?: number }> {
  if (watchedSeconds <= 0) {
    return { success: true }; // Nothing to record
  }

  const hoursToAdd = watchedSeconds / 3600;

  // Fetch current stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_stats')
    .select('total_hours')
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // No stats exist - create new record
      const { error: insertError } = await supabase.from('user_stats').insert({
        user_id: userId,
        total_hours: hoursToAdd,
        total_grinds: 0,
        current_streak: 0,
        last_grind_at: new Date().toISOString(),
        streak_earned_date: null,
        today_accumulated_hours: 0,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[StatsService] Error creating user stats:', insertError);
        return { success: false };
      }
      return { success: true, newTotalHours: hoursToAdd };
    }
    console.error('[StatsService] Error fetching stats for watch time:', fetchError);
    return { success: false };
  }

  // Calculate new total hours
  const newTotalHours = Number(existingStats.total_hours) + hoursToAdd;

  // Update stats
  const { error: updateError } = await supabase
    .from('user_stats')
    .update({
      total_hours: newTotalHours,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('[StatsService] Error updating watch time:', updateError);
    return { success: false };
  }

  return { success: true, newTotalHours };
}
