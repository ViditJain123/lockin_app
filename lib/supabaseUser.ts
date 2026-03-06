import { supabase } from './supabase';

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
