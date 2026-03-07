-- 002_add_applock_columns.sql
-- Add sleep_time and target_hours columns to users table for app lock feature

ALTER TABLE users
  ADD COLUMN sleep_time TEXT NOT NULL DEFAULT '22:00',
  ADD COLUMN target_hours INTEGER NOT NULL DEFAULT 4;
