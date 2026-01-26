import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { supabase } from './supabase';
import { isVersionLessThan } from './versionUtils';

// App configuration
const APP_BUNDLE_ID = 'com.lockin.club';
// You'll need to update this with your actual iTunes App ID from App Store Connect
const ITUNES_APP_ID = ''; // e.g., '123456789'

export interface AppVersionConfig {
  platform: 'ios' | 'android';
  minimumVersion: string;
  recommendedVersion: string;
  latestVersion: string;
  forceUpdateMessage: string;
  softUpdateMessage: string;
  appStoreUrl: string;
}

export type UpdateType = 'force' | 'soft' | 'none';

export interface UpdateCheckResult {
  updateType: UpdateType;
  currentVersion: string;
  latestVersion: string;
  message: string;
  appStoreUrl: string;
}

/**
 * Get the current app version from expo-constants
 */
export function getCurrentAppVersion(): string {
  // In Expo, the version comes from app.json
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Fetch version configuration from Supabase
 */
async function fetchVersionFromSupabase(): Promise<AppVersionConfig | null> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('platform', platform)
      .single();

    if (error) {
      console.log('[AppUpdate] Supabase fetch error:', error.message);
      return null;
    }

    if (!data) {
      console.log('[AppUpdate] No version config found in Supabase');
      return null;
    }

    return {
      platform: data.platform,
      minimumVersion: data.minimum_version,
      recommendedVersion: data.recommended_version,
      latestVersion: data.latest_version,
      forceUpdateMessage: data.force_update_message || 'A critical update is required to continue using the app.',
      softUpdateMessage: data.soft_update_message || 'A new version is available with improvements and bug fixes.',
      appStoreUrl: data.app_store_url || getDefaultAppStoreUrl(),
    };
  } catch (error) {
    console.error('[AppUpdate] Error fetching from Supabase:', error);
    return null;
  }
}

/**
 * Fetch version information from iTunes Lookup API (iOS only)
 * This is a fallback when Supabase is unavailable
 */
async function fetchVersionFromiTunes(): Promise<AppVersionConfig | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${APP_BUNDLE_ID}&country=us`
    );

    if (!response.ok) {
      console.log('[AppUpdate] iTunes API response not OK:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('[AppUpdate] No results from iTunes API (app may not be published yet)');
      return null;
    }

    const appInfo = data.results[0];
    const latestVersion = appInfo.version;

    return {
      platform: 'ios',
      minimumVersion: latestVersion, // iTunes doesn't provide minimum, so we use latest
      recommendedVersion: latestVersion,
      latestVersion,
      forceUpdateMessage: 'A new version is available. Please update to continue.',
      softUpdateMessage: 'A new version is available with improvements and bug fixes.',
      appStoreUrl: appInfo.trackViewUrl || getDefaultAppStoreUrl(),
    };
  } catch (error) {
    console.error('[AppUpdate] Error fetching from iTunes:', error);
    return null;
  }
}

/**
 * Get default App Store URL
 */
function getDefaultAppStoreUrl(): string {
  if (Platform.OS === 'ios') {
    // Use the iTunes App ID if available, otherwise use the bundle ID
    if (ITUNES_APP_ID) {
      return `https://apps.apple.com/app/id${ITUNES_APP_ID}`;
    }
    return `https://apps.apple.com/app/${APP_BUNDLE_ID}`;
  }
  // Android Play Store URL
  return `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;
}

/**
 * Check for app updates
 * Tries Supabase first, then falls back to iTunes API
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();

  // Default result (no update needed)
  const defaultResult: UpdateCheckResult = {
    updateType: 'none',
    currentVersion,
    latestVersion: currentVersion,
    message: '',
    appStoreUrl: getDefaultAppStoreUrl(),
  };

  try {
    // Try Supabase first (gives us full control over force/soft updates)
    let versionConfig = await fetchVersionFromSupabase();

    // Fall back to iTunes API if Supabase fails
    if (!versionConfig) {
      console.log('[AppUpdate] Falling back to iTunes API');
      versionConfig = await fetchVersionFromiTunes();
    }

    // If both fail, return no update needed
    if (!versionConfig) {
      console.log('[AppUpdate] Could not fetch version config from any source');
      return defaultResult;
    }

    const { minimumVersion, recommendedVersion, latestVersion } = versionConfig;

    // Check if force update is needed (current < minimum)
    if (isVersionLessThan(currentVersion, minimumVersion)) {
      console.log(`[AppUpdate] Force update required: ${currentVersion} < ${minimumVersion}`);
      return {
        updateType: 'force',
        currentVersion,
        latestVersion,
        message: versionConfig.forceUpdateMessage,
        appStoreUrl: versionConfig.appStoreUrl,
      };
    }

    // Check if soft update is available (current < recommended)
    if (isVersionLessThan(currentVersion, recommendedVersion)) {
      console.log(`[AppUpdate] Soft update available: ${currentVersion} < ${recommendedVersion}`);
      return {
        updateType: 'soft',
        currentVersion,
        latestVersion,
        message: versionConfig.softUpdateMessage,
        appStoreUrl: versionConfig.appStoreUrl,
      };
    }

    console.log(`[AppUpdate] App is up to date: ${currentVersion}`);
    return {
      ...defaultResult,
      latestVersion,
      appStoreUrl: versionConfig.appStoreUrl,
    };
  } catch (error) {
    console.error('[AppUpdate] Unexpected error checking for updates:', error);
    return defaultResult;
  }
}

/**
 * Open the App Store page for the app
 */
export async function openAppStore(url?: string): Promise<void> {
  const storeUrl = url || getDefaultAppStoreUrl();

  try {
    const canOpen = await Linking.canOpenURL(storeUrl);
    if (canOpen) {
      await Linking.openURL(storeUrl);
    } else {
      console.error('[AppUpdate] Cannot open App Store URL:', storeUrl);
    }
  } catch (error) {
    console.error('[AppUpdate] Error opening App Store:', error);
  }
}
