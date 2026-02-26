-- Migration: Add updated_at to user_tasks for conflict resolution

-- Add updated_at column
ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill existing rows
UPDATE user_tasks SET updated_at = created_at WHERE updated_at IS NULL;

-- Auto-update trigger (same pattern as user_profiles)
CREATE OR REPLACE FUNCTION update_user_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_user_tasks_updated_at();
