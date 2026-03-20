import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';
import { ATTRIBUTION_DEV_MODE } from './config';

const PENDING_KEY = 'pending_attribution';
const RESOLVED_KEY = 'resolved_attribution';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface ResolvedAttribution extends UTMParams {
  attribution_type: 'deep_link' | 'deferred' | 'organic';
}

/**
 * Parse UTM parameters from a URL string.
 * Returns null if no UTM params are found.
 */
export function parseUTMParams(url: string): UTMParams | null {
  try {
    const parsed = new URL(url);
    const params: UTMParams = {};
    let hasAny = false;

    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const) {
      const value = parsed.searchParams.get(key);
      if (value) {
        params[key] = value;
        hasAny = true;
      }
    }

    return hasAny ? params : null;
  } catch {
    return null;
  }
}

/**
 * Store UTM params from a deep link for later resolution.
 */
export async function storePendingAttribution(params: UTMParams): Promise<void> {
  if (ATTRIBUTION_DEV_MODE) {
    console.log('[Attribution] Storing pending attribution:', params);
  }
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(params));
}

/**
 * Resolve attribution for a user after sign-in.
 * 1. Check for pending deep link attribution
 * 2. If none, call match-attribution edge function for deferred matching
 * 3. Store resolved attribution for RevenueCat tagging
 */
export async function resolveAttribution(userId: string): Promise<ResolvedAttribution | null> {
  try {
    // Check if already resolved
    const existingRaw = await AsyncStorage.getItem(RESOLVED_KEY);
    if (existingRaw) {
      if (ATTRIBUTION_DEV_MODE) {
        console.log('[Attribution] Already resolved:', existingRaw);
      }
      return JSON.parse(existingRaw);
    }

    // Check for pending deep link attribution
    const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
    if (pendingRaw) {
      const params: UTMParams = JSON.parse(pendingRaw);
      if (ATTRIBUTION_DEV_MODE) {
        console.log('[Attribution] Resolving from deep link:', params);
      }

      const resolved: ResolvedAttribution = {
        ...params,
        attribution_type: 'deep_link',
      };

      // Write to user_attribution table
      await supabase.from('user_attribution').upsert({
        user_id: userId,
        attribution_type: 'deep_link',
        utm_source: params.utm_source || null,
        utm_medium: params.utm_medium || null,
        utm_campaign: params.utm_campaign || null,
        utm_content: params.utm_content || null,
        utm_term: params.utm_term || null,
      });

      // Store resolved and clear pending
      await AsyncStorage.setItem(RESOLVED_KEY, JSON.stringify(resolved));
      await AsyncStorage.removeItem(PENDING_KEY);

      return resolved;
    }

    // No deep link — try deferred matching via edge function
    if (ATTRIBUTION_DEV_MODE) {
      console.log('[Attribution] No pending deep link, trying deferred match');
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || undefined;

    const { data, error } = await supabase.functions.invoke('match-attribution', {
      body: { user_id: userId, timezone, locale },
    });

    if (error) {
      console.warn('[Attribution] Edge function error:', error);
      return null;
    }

    const resolved: ResolvedAttribution = {
      attribution_type: data.attribution_type || 'organic',
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
    };

    await AsyncStorage.setItem(RESOLVED_KEY, JSON.stringify(resolved));

    if (ATTRIBUTION_DEV_MODE) {
      console.log('[Attribution] Resolved:', resolved);
    }

    return resolved;
  } catch (err) {
    console.warn('[Attribution] Resolution failed:', err);
    return null;
  }
}
