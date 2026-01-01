-- Add index on grinds table for faster date-based activity queries
-- This optimizes the heatmap feature which groups recordings by date

CREATE INDEX IF NOT EXISTS idx_grinds_user_date ON grinds(user_id, created_at);
