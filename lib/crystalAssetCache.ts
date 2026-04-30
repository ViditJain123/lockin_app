import { Asset } from 'expo-asset';

// Per-crystal image module map. Replaces the old badgeAssetCache.
// Files live at assets/images/crystals/<tier>/<id>.png — placeholders today,
// final renders dropped in by the asset pipeline.
const CRYSTAL_ASSETS: Record<string, number> = {
  // Common
  quartz: require('../assets/images/crystals/common/quartz.png'),
  agate: require('../assets/images/crystals/common/agate.png'),
  citrine: require('../assets/images/crystals/common/citrine.png'),
  onyx: require('../assets/images/crystals/common/onyx.png'),
  jasper: require('../assets/images/crystals/common/jasper.png'),
  hematite: require('../assets/images/crystals/common/hematite.png'),

  // Uncommon
  amethyst: require('../assets/images/crystals/uncommon/amethyst.png'),
  peridot: require('../assets/images/crystals/uncommon/peridot.png'),
  aquamarine: require('../assets/images/crystals/uncommon/aquamarine.png'),
  topaz: require('../assets/images/crystals/uncommon/topaz.png'),
  garnet: require('../assets/images/crystals/uncommon/garnet.png'),
  lapis_lazuli: require('../assets/images/crystals/uncommon/lapis_lazuli.png'),
  moonstone: require('../assets/images/crystals/uncommon/moonstone.png'),
  carnelian: require('../assets/images/crystals/uncommon/carnelian.png'),

  // Rare
  emerald: require('../assets/images/crystals/rare/emerald.png'),
  ruby: require('../assets/images/crystals/rare/ruby.png'),
  sapphire: require('../assets/images/crystals/rare/sapphire.png'),
  tanzanite: require('../assets/images/crystals/rare/tanzanite.png'),
  tourmaline: require('../assets/images/crystals/rare/tourmaline.png'),
  spinel: require('../assets/images/crystals/rare/spinel.png'),
  imperial_topaz: require('../assets/images/crystals/rare/imperial_topaz.png'),
  diamond: require('../assets/images/crystals/rare/diamond.png'),

  // Epic
  black_opal: require('../assets/images/crystals/epic/black_opal.png'),
  alexandrite: require('../assets/images/crystals/epic/alexandrite.png'),
  fire_opal: require('../assets/images/crystals/epic/fire_opal.png'),
  painite: require('../assets/images/crystals/epic/painite.png'),
  tahitian_pearl: require('../assets/images/crystals/epic/tahitian_pearl.png'),

  // Mythic
  void_prism: require('../assets/images/crystals/mythic/void_prism.png'),
  eclipse_stone: require('../assets/images/crystals/mythic/eclipse_stone.png'),
  heart_of_focus: require('../assets/images/crystals/mythic/heart_of_focus.png'),
};

const crystalUriCache = new Map<string, string>();
let preloadPromise: Promise<void> | null = null;

export async function preloadAllCrystals(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const ids = Object.keys(CRYSTAL_ASSETS);
    await Promise.all(
      ids.map(async (id) => {
        try {
          const asset = Asset.fromModule(CRYSTAL_ASSETS[id]);
          await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          if (uri) crystalUriCache.set(id, uri);
        } catch (err) {
          console.warn(`[CrystalCache] Failed to preload ${id}:`, err);
        }
      })
    );
    console.log(`[CrystalCache] Preloaded ${crystalUriCache.size}/${ids.length} crystals`);
  })();

  return preloadPromise;
}

export function getCrystalUri(id: string): string | undefined {
  return crystalUriCache.get(id);
}

export function getCrystalAssetModule(id: string): number | undefined {
  return CRYSTAL_ASSETS[id];
}
