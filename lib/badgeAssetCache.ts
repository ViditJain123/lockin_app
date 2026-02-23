import { Asset } from 'expo-asset';

// Badge image mapping - PNG assets in new folders
const BADGE_ASSETS: Record<string, number> = {
  // Hours badges
  'hours-3': require('../assets/images/grindhours/3 hours.png'),
  'hours-5': require('../assets/images/grindhours/5 hours.png'),
  'hours-10': require('../assets/images/grindhours/10 hours.png'),
  'hours-25': require('../assets/images/grindhours/25 hours.png'),
  'hours-40': require('../assets/images/grindhours/40 hours.png'),
  'hours-50': require('../assets/images/grindhours/50 hours.png'),
  'hours-75': require('../assets/images/grindhours/75 hours.png'),
  'hours-100': require('../assets/images/grindhours/100 hours.png'),
  // Grinds badges
  'grinds-1': require('../assets/images/number_0f_grinds/Grind 1.png'),
  'grinds-5': require('../assets/images/number_0f_grinds/Grind 5.png'),
  'grinds-10': require('../assets/images/number_0f_grinds/Grind 10.png'),
  'grinds-20': require('../assets/images/number_0f_grinds/Grind 20.png'),
  'grinds-30': require('../assets/images/number_0f_grinds/Grind 30.png'),
  'grinds-50': require('../assets/images/number_0f_grinds/Grind 50.png'),
  'grinds-75': require('../assets/images/number_0f_grinds/Grind 75.png'),
  'grinds-100': require('../assets/images/number_0f_grinds/Grind 100.png'),
  // Streak badges
  'streak-3': require('../assets/images/streak_badges/3 streak.png'),
  'streak-5': require('../assets/images/streak_badges/5 streak.png'),
  'streak-10': require('../assets/images/streak_badges/10 streak.png'),
  'streak-21': require('../assets/images/streak_badges/21 streak.png'),
  'streak-30': require('../assets/images/streak_badges/30 streak.png'),
  'streak-40': require('../assets/images/streak_badges/40 streak.png'),
  'streak-50': require('../assets/images/streak_badges/50 streak.png'),
};

// Singleton cache storing badgeId → localUri
const badgeUriCache = new Map<string, string>();

let preloadPromise: Promise<void> | null = null;

/**
 * Pre-downloads all badge image assets in parallel.
 * Call this at app startup (fire and forget - don't block splash).
 */
export async function preloadAllBadges(): Promise<void> {
  // Return existing promise if already loading
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    const badgeIds = Object.keys(BADGE_ASSETS);

    const loadPromises = badgeIds.map(async (badgeId) => {
      try {
        const assetModule = BADGE_ASSETS[badgeId];
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();

        const uri = asset.localUri || asset.uri;
        if (uri) {
          badgeUriCache.set(badgeId, uri);
        }
      } catch (error) {
        console.warn(`[BadgeCache] Failed to preload ${badgeId}:`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`[BadgeCache] Preloaded ${badgeUriCache.size}/${badgeIds.length} badges`);
  })();

  return preloadPromise;
}

/**
 * Synchronous lookup for a badge's cached URI.
 * Returns undefined if not yet cached (rare edge case during initial load).
 */
export function getBadgeUri(badgeId: string): string | undefined {
  return badgeUriCache.get(badgeId);
}

/**
 * Check if a badge is already cached.
 */
export function isBadgeCached(badgeId: string): boolean {
  return badgeUriCache.has(badgeId);
}

/**
 * Get the asset module for a badge (for fallback rendering).
 */
export function getBadgeAssetModule(badgeId: string): number | undefined {
  return BADGE_ASSETS[badgeId];
}
