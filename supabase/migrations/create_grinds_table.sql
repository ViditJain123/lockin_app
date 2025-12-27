-- Create grinds table to track video/thumbnail relationships
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS grinds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_path TEXT NOT NULL,
  thumbnail_path TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE grinds ENABLE ROW LEVEL SECURITY;

-- Users can only view their own grinds
CREATE POLICY "Users can view own grinds" ON grinds
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own grinds
CREATE POLICY "Users can insert own grinds" ON grinds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own grinds
CREATE POLICY "Users can delete own grinds" ON grinds
  FOR DELETE USING (auth.uid() = user_id);
