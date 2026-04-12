-- Add display_name column to users table for leaderboard
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Public view exposing only id + display_name for leaderboard name resolution
-- Views bypass RLS, so other users can look up names without broader table access
CREATE VIEW public.leaderboard_profiles AS
  SELECT id, display_name FROM public.users;

GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;
