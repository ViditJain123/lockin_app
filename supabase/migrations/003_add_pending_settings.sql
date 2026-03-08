ALTER TABLE users
  ADD COLUMN pending_target_hours INTEGER,
  ADD COLUMN pending_sleep_time TEXT,
  ADD COLUMN pending_settings_date TEXT;
