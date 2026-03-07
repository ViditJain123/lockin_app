import { supabase } from './supabase';
import type { SleepTime } from '../store/useOnboardingStore';

export function convertSleepTimeTo24h(sleepTime: SleepTime): string {
  let hour24 = sleepTime.hour;
  if (sleepTime.period === 'AM') {
    if (hour24 === 12) hour24 = 0;
  } else {
    if (hour24 !== 12) hour24 += 12;
  }
  return `${hour24.toString().padStart(2, '0')}:${sleepTime.minute.toString().padStart(2, '0')}`;
}

export function parseSleepTime24h(time24h: string): SleepTime {
  const [hourStr, minuteStr] = time24h.split(':');
  const hour24 = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: hour12, minute, period };
}

export async function fetchUserRow(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null; // row not found
  if (error) throw error;
  return data;
}

export async function upsertUserRow(
  userId: string,
  fields: Record<string, unknown>
) {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, ...fields }, { onConflict: 'id' });

  if (error) throw error;
}

export async function updateMaxStreakIfHigher(
  userId: string,
  currentStreak: number
): Promise<number> {
  const row = await fetchUserRow(userId);
  const storedMax = row?.max_streak ?? 0;

  if (currentStreak > storedMax) {
    await upsertUserRow(userId, { max_streak: currentStreak });
    return currentStreak;
  }

  return storedMax;
}
