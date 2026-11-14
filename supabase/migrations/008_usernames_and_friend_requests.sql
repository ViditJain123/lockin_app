-- Usernames + friend requests (replaces invite links)
--
-- Users pick a unique @username. Others find them with search_users() and send
-- a friend request; once the other person accepts, a friendship row is created
-- in both directions (see 007). If both people request each other, the second
-- request accepts the first.

-- 3–20 chars: lowercase letters, numbers, dot, underscore
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_format;
ALTER TABLE users ADD CONSTRAINT users_username_format CHECK (username ~ '^[a-z0-9._]{3,20}$');
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

-- Expose usernames next to display names for friend lists and the leaderboard
CREATE OR REPLACE VIEW public.leaderboard_profiles AS
  SELECT id, display_name, username FROM public.users;
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;

CREATE TABLE IF NOT EXISTS friend_requests (
  from_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id <> to_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_to_idx ON friend_requests (to_id);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);

-- Cancel one you sent, or decline one you received
CREATE POLICY "delete own requests" ON friend_requests
  FOR DELETE USING (auth.uid() = from_id OR auth.uid() = to_id);

-- Inserts go through send_friend_request() so the auto-accept rule holds

-- Search by username prefix. Returns the caller's relationship to each match:
-- 'friend', 'sent' (you requested them), 'received' (they requested you) or 'none'.
CREATE OR REPLACE FUNCTION search_users(q TEXT)
RETURNS TABLE (id UUID, username TEXT, display_name TEXT, status TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.username, u.display_name,
    CASE
      WHEN EXISTS (SELECT 1 FROM friendships f WHERE f.user_id = auth.uid() AND f.friend_id = u.id) THEN 'friend'
      WHEN EXISTS (SELECT 1 FROM friend_requests r WHERE r.from_id = auth.uid() AND r.to_id = u.id) THEN 'sent'
      WHEN EXISTS (SELECT 1 FROM friend_requests r WHERE r.from_id = u.id AND r.to_id = auth.uid()) THEN 'received'
      ELSE 'none'
    END
  FROM users u
  WHERE length(trim(q)) >= 2
    AND u.username LIKE lower(trim(leading '@' from trim(q))) || '%'
    AND u.id <> auth.uid()
  ORDER BY u.username
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION search_users(TEXT) TO authenticated;

-- Send a request. If they already asked you, you become friends instead.
-- Returns 'sent' or 'friends'.
CREATE OR REPLACE FUNCTION send_friend_request(target UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target IS NULL OR target = auth.uid() THEN
    RAISE EXCEPTION 'invalid target';
  END IF;
  IF EXISTS (SELECT 1 FROM friendships WHERE user_id = auth.uid() AND friend_id = target) THEN
    RETURN 'friends';
  END IF;
  IF EXISTS (SELECT 1 FROM friend_requests WHERE from_id = target AND to_id = auth.uid()) THEN
    DELETE FROM friend_requests WHERE (from_id = target AND to_id = auth.uid()) OR (from_id = auth.uid() AND to_id = target);
    INSERT INTO friendships (user_id, friend_id) VALUES (auth.uid(), target), (target, auth.uid())
      ON CONFLICT DO NOTHING;
    RETURN 'friends';
  END IF;
  INSERT INTO friend_requests (from_id, to_id) VALUES (auth.uid(), target) ON CONFLICT DO NOTHING;
  RETURN 'sent';
END;
$$;

GRANT EXECUTE ON FUNCTION send_friend_request(UUID) TO authenticated;

-- Accept a request someone sent you
CREATE OR REPLACE FUNCTION accept_friend_request(requester UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM friend_requests WHERE from_id = requester AND to_id = auth.uid();
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  DELETE FROM friend_requests WHERE from_id = auth.uid() AND to_id = requester;
  INSERT INTO friendships (user_id, friend_id) VALUES (auth.uid(), requester), (requester, auth.uid())
    ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
