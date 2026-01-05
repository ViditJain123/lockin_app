-- Add upload_status column to track grind upload state
-- Run this in Supabase SQL Editor

-- Add upload_status column with default 'completed' for existing records
ALTER TABLE grinds 
ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'completed' 
CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed'));

-- Make video_url nullable for pending uploads
ALTER TABLE grinds ALTER COLUMN video_url DROP NOT NULL;

-- Add local_video_path column to store the local file path for pending uploads
ALTER TABLE grinds ADD COLUMN IF NOT EXISTS local_video_path TEXT;

-- Create index for faster queries on upload_status
CREATE INDEX IF NOT EXISTS idx_grinds_upload_status ON grinds(user_id, upload_status);

-- Update RLS policy to allow users to update their own grinds
CREATE POLICY IF NOT EXISTS "Users can update own grinds" ON grinds
  FOR UPDATE USING (auth.uid() = user_id);

-- Comment: upload_status values:
-- 'pending' - Record created, upload not started or in queue
-- 'uploading' - Upload currently in progress
-- 'completed' - Upload finished successfully  
-- 'failed' - Upload failed after retries
