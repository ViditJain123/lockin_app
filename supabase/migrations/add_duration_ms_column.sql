-- Add duration_ms column to grinds table if it doesn't exist
-- This column stores the recording duration in milliseconds

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'grinds' AND column_name = 'duration_ms'
    ) THEN
        ALTER TABLE grinds ADD COLUMN duration_ms INTEGER;
    END IF;
END $$;
