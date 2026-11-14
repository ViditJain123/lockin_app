-- Friends + timelapse stories
--
-- friendships: one row per pair, stored both directions so "my friends" is a
-- single indexed lookup. Created via accept_friend_invite() (invite links).
-- stories: a timelapse a user shares with friends for 24h. The video lives in
-- the private `stories` storage bucket at <user_id>/<story_id>.mp4.

CREATE TABLE IF NOT EXISTS friendships (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships (friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "remove own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Short, shareable invite code per user (first 8 hex chars of a random uuid)
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
UPDATE users SET invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  WHERE invite_code IS NULL;
ALTER TABLE users ALTER COLUMN invite_code SET DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Accept an invite: befriends the caller and the code's owner (both directions)
CREATE OR REPLACE FUNCTION accept_friend_invite(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter UUID;
BEGIN
  SELECT id INTO inviter FROM users WHERE invite_code = lower(code);
  IF inviter IS NULL OR inviter = auth.uid() THEN
    RETURN NULL;
  END IF;
  INSERT INTO friendships (user_id, friend_id) VALUES (auth.uid(), inviter), (inviter, auth.uid())
    ON CONFLICT DO NOTHING;
  RETURN inviter;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_friend_invite(TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS stories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_path       TEXT NOT NULL,
  thumbnail_path   TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS stories_user_idx ON stories (user_id, created_at DESC);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- You see your own stories and your friends' unexpired ones
CREATE POLICY "read own and friends stories" ON stories
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      expires_at > now()
      AND EXISTS (SELECT 1 FROM friendships f WHERE f.user_id = auth.uid() AND f.friend_id = stories.user_id)
    )
  );

CREATE POLICY "post own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Private bucket for story videos/thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "upload own story files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "read own and friends story files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stories'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.user_id = auth.uid() AND f.friend_id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY "delete own story files" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);
