-- 006_add_email_and_apple_name.sql
-- Capture identity from Apple Sign-In: email (real or relay) and Apple-provided full name.
-- display_name (from quiz) stays as the user-chosen name; apple_full_name is what Apple returned.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS apple_full_name TEXT;

-- Bootstrap a public.users row whenever a new auth.users row is created.
-- Pulls email straight from auth.users so the row exists even if the client-side
-- upsert fails. SECURITY DEFINER lets it bypass RLS; search_path is pinned for safety.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = COALESCE(public.users.email, EXCLUDED.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users with their auth email
UPDATE public.users u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id
  AND u.email IS NULL
  AND a.email IS NOT NULL;
