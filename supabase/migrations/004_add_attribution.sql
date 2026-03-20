-- Attribution tracking tables for revenue attribution via UTM/deep linking

-- Table: attribution_clicks
-- Records every landing page visit with fingerprint data for deferred matching
CREATE TABLE IF NOT EXISTS attribution_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  timezone TEXT,
  locale TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_url TEXT,
  matched_user_id UUID REFERENCES auth.users(id),
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for deferred matching: lookup by IP + recency
CREATE INDEX idx_attribution_clicks_ip_created
  ON attribution_clicks (ip_address, created_at DESC);

-- Index for finding unmatched clicks efficiently
CREATE INDEX idx_attribution_clicks_unmatched
  ON attribution_clicks (ip_address, created_at DESC)
  WHERE matched_user_id IS NULL;

-- Table: user_attribution
-- Resolved attribution per user (one row per user)
CREATE TABLE IF NOT EXISTS user_attribution (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  attribution_type TEXT NOT NULL CHECK (attribution_type IN ('deep_link', 'deferred', 'organic')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  click_id UUID REFERENCES attribution_clicks(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies

-- attribution_clicks: no user access (service role only)
ALTER TABLE attribution_clicks ENABLE ROW LEVEL SECURITY;

-- user_attribution: users can read their own row
ALTER TABLE user_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attribution"
  ON user_attribution
  FOR SELECT
  USING (auth.uid() = user_id);
