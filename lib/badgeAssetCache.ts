import { Asset } from 'expo-asset';

// Badge image mapping - same as BadgeImage.tsx
const BADGE_ASSETS: Record<string, number> = {
  // Hours badges
  'hours-1': require('../assets/images/lockinbadges/grindhour1.svg'),
  'hours-5': require('../assets/images/lockinbadges/grindhours5.svg'),
  'hours-10': require('../assets/images/lockinbadges/grindhours10.svg'),
  'hours-25': require('../assets/images/lockinbadges/grindhours25.svg'),
  'hours-50': require('../assets/images/lockinbadges/grindhours50.svg'),
  'hours-100': require('../assets/images/lockinbadges/grindhours100.svg'),
  // Grinds badges
  'grinds-1': require('../assets/images/lockinbadges/grinds1.svg'),
  'grinds-5': require('../assets/images/lockinbadges/grinds5.svg'),
  'grinds-10': require('../assets/images/lockinbadges/grinds10.svg'),
  'grinds-20': require('../assets/images/lockinbadges/grinds20.svg'),
  'grinds-50': require('../assets/images/lockinbadges/grinds50.svg'),
  'grinds-75': require('../assets/images/lockinbadges/grinds75.svg'),
  'grinds-100': require('../assets/images/lockinbadges/grinds100.svg'),
  // Streak badges
  'streak-3': require('../assets/images/lockinbadges/streak3.svg'),
  'streak-5': require('../assets/images/lockinbadges/streak5.svg'),
  'streak-10': require('../assets/images/lockinbadges/streak10.svg'),
  'streak-21': require('../assets/images/lockinbadges/streak21.svg'),
  'streak-30': require('../assets/images/lockinbadges/streak30.svg'),
};

// Singleton cache storing badgeId → localUri
const badgeUriCache = new Map<string, string>();

let preloadPromise: Promise<void> | null = null;

/**
 * Pre-downloads all badge SVG assets in parallel.
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
