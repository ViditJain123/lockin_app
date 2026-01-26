-- Add streak tracking fields for calendar-day based streak logic
-- streak_earned_date: stores YYYY-MM-DD when streak was last earned
-- today_accumulated_hours: hours accumulated today toward 1-hour goal

ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS streak_earned_date TEXT,
ADD COLUMN IF NOT EXISTS today_accumulated_hours DECIMAL(10, 4) DEFAULT 0;

-- Backfill existing users: assume their current streak is valid
-- Set streak_earned_date to the date of their last grind
-- Reset today_accumulated_hours to 0 since we don't know today's actual accumulation
UPDATE user_stats
SET streak_earned_date = TO_CHAR(last_grind_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
    today_accumulated_hours = 0
WHERE streak_earned_date IS NULL AND last_grind_at IS NOT NULL;
