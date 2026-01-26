-- Create app_versions table for managing app update notifications
-- This table stores version configuration for force and soft updates

CREATE TABLE IF NOT EXISTS app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    minimum_version TEXT NOT NULL,
    recommended_version TEXT NOT NULL,
    latest_version TEXT NOT NULL,
    force_update_message TEXT DEFAULT 'A critical update is required to continue using the app.',
    soft_update_message TEXT DEFAULT 'A new version is available with improvements and bug fixes.',
    app_store_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (platform)
);

-- Create an index on platform for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions(platform);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_app_versions_updated_at ON app_versions;
CREATE TRIGGER trigger_app_versions_updated_at
    BEFORE UPDATE ON app_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_app_versions_updated_at();

-- Enable Row Level Security
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (app needs to read version config without auth)
CREATE POLICY "Allow public read access to app_versions"
    ON app_versions
    FOR SELECT
    TO public
    USING (true);

-- Only authenticated users with admin role can modify (you may want to adjust this)
-- For now, we'll allow service role only to modify
CREATE POLICY "Allow service role to manage app_versions"
    ON app_versions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert initial iOS configuration
-- Update the app_store_url with your actual App Store URL once the app is published
INSERT INTO app_versions (platform, minimum_version, recommended_version, latest_version, app_store_url)
VALUES (
    'ios',
    '1.0.0',  -- minimum_version: Users below this MUST update (force update)
    '1.0.3',  -- recommended_version: Users below this will see a dismissible banner
    '1.0.3',  -- latest_version: The latest available version
    'https://apps.apple.com/app/com.lockin.club'  -- Update with your actual App Store URL
)
ON CONFLICT (platform) DO UPDATE SET
    minimum_version = EXCLUDED.minimum_version,
    recommended_version = EXCLUDED.recommended_version,
    latest_version = EXCLUDED.latest_version,
    app_store_url = EXCLUDED.app_store_url;

-- Insert initial Android configuration (optional, for future use)
INSERT INTO app_versions (platform, minimum_version, recommended_version, latest_version, app_store_url)
VALUES (
    'android',
    '1.0.0',
    '1.0.3',
    '1.0.3',
    'https://play.google.com/store/apps/details?id=com.lockin.club'
)
ON CONFLICT (platform) DO UPDATE SET
    minimum_version = EXCLUDED.minimum_version,
    recommended_version = EXCLUDED.recommended_version,
    latest_version = EXCLUDED.latest_version,
    app_store_url = EXCLUDED.app_store_url;

-- Grant necessary permissions
GRANT SELECT ON app_versions TO anon;
GRANT SELECT ON app_versions TO authenticated;
