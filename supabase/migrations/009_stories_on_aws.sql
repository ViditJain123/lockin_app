-- Stories: videos move to AWS (S3 + CloudFront); rows stay here.
--
-- * stories.video_path is now the S3 key  v/<user_id>/<story_id>.<random>.mp4
-- * story_views records who watched each story (one row per viewer)
-- * created_at / expires_at are set by the database, never by the client
-- * expired stories are deleted every hour, so this table only ever holds
--   the last 24 hours. Their views go with them (ON DELETE CASCADE).
--   The video files are removed separately by an S3 lifecycle rule.

-- ─── stories ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS stories_expires_idx ON stories (expires_at);

-- A story can only point at a file inside its owner's own folder
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_video_path_owner;
ALTER TABLE stories ADD CONSTRAINT stories_video_path_owner
  CHECK (video_path LIKE 'v/' || user_id::text || '/%') NOT VALID;

-- The 24h window is enforced here: whatever the client sends is overwritten
CREATE OR REPLACE FUNCTION stories_set_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_set_window ON stories;
CREATE TRIGGER stories_set_window
  BEFORE INSERT ON stories
  FOR EACH ROW EXECUTE FUNCTION stories_set_window();

-- ─── story_views ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_views (
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- You can mark a story as viewed only if you are allowed to see it (the
-- sub-select runs under the stories policies: a friend's unexpired story)
-- and it is not your own.
DROP POLICY IF EXISTS "record own view" ON story_views;
CREATE POLICY "record own view" ON story_views
  FOR INSERT WITH CHECK (
    auth.uid() = viewer_id
    AND EXISTS (SELECT 1 FROM stories s WHERE s.id = story_views.story_id AND s.user_id <> auth.uid())
  );

-- The poster sees everyone who viewed; a viewer sees only their own row
DROP POLICY IF EXISTS "read views of own stories" ON story_views;
CREATE POLICY "read views of own stories" ON story_views
  FOR SELECT USING (
    auth.uid() = viewer_id
    OR EXISTS (SELECT 1 FROM stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid())
  );

GRANT SELECT, INSERT ON story_views TO authenticated;

-- ─── hourly cleanup ─────────────────────────────────────────────────────────

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'delete-expired-stories',
    '7 * * * *',
    'DELETE FROM public.stories WHERE expires_at < now()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_cron not available (%). Enable it under Database > Extensions, then re-run this block.', SQLERRM;
END;
$$;
