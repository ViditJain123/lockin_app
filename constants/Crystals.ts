// Crystal collection — 30 gemstones across 5 rarity tiers, earned at milestone levels.
// See plan: /Users/viditjain/.claude/plans/i-want-to-add-velvety-hammock.md

export type CrystalTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';

export interface CrystalDefinition {
  id: string;
  tier: CrystalTier;
  milestoneLevel: number;
  name: string;
  lore: string;
  imageFileName: string; // file under assets/images/crystals/<tier>/
}

export const TIER_COLORS: Record<CrystalTier, string> = {
  common: '#f4f1ea',
  uncommon: '#60a5fa',
  rare: '#a855f7',
  epic: '#fbbf24',
  mythic: '#FF3B5C',
};

export const TIER_LABELS: Record<CrystalTier, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  mythic: 'MYTHIC',
};

export const TIER_ORDER: CrystalTier[] = ['common', 'uncommon', 'rare', 'epic', 'mythic'];

export const CRYSTALS: CrystalDefinition[] = [
  // Tier 1 — Common (raw, unpolished)
  { id: 'quartz', tier: 'common', milestoneLevel: 1, name: 'Quartz', lore: 'The seed of every grind.', imageFileName: 'quartz.png' },
  { id: 'agate', tier: 'common', milestoneLevel: 2, name: 'Agate', lore: 'Layered like every habit.', imageFileName: 'agate.png' },
  { id: 'citrine', tier: 'common', milestoneLevel: 3, name: 'Citrine', lore: 'First spark of momentum.', imageFileName: 'citrine.png' },
  { id: 'onyx', tier: 'common', milestoneLevel: 4, name: 'Onyx', lore: 'Discipline forged in dark.', imageFileName: 'onyx.png' },
  { id: 'jasper', tier: 'common', milestoneLevel: 5, name: 'Jasper', lore: 'Patience, set in stone.', imageFileName: 'jasper.png' },
  { id: 'hematite', tier: 'common', milestoneLevel: 7, name: 'Hematite', lore: 'Iron-clad focus.', imageFileName: 'hematite.png' },

  // Tier 2 — Uncommon (polished, glossy)
  { id: 'amethyst', tier: 'uncommon', milestoneLevel: 10, name: 'Amethyst', lore: 'Clarity under pressure.', imageFileName: 'amethyst.png' },
  { id: 'peridot', tier: 'uncommon', milestoneLevel: 13, name: 'Peridot', lore: 'Renewal in green.', imageFileName: 'peridot.png' },
  { id: 'aquamarine', tier: 'uncommon', milestoneLevel: 16, name: 'Aquamarine', lore: 'Calm mind, deep work.', imageFileName: 'aquamarine.png' },
  { id: 'topaz', tier: 'uncommon', milestoneLevel: 20, name: 'Topaz', lore: 'Sunlit resolve.', imageFileName: 'topaz.png' },
  { id: 'garnet', tier: 'uncommon', milestoneLevel: 25, name: 'Garnet', lore: 'Heart of the grind.', imageFileName: 'garnet.png' },
  { id: 'lapis_lazuli', tier: 'uncommon', milestoneLevel: 30, name: 'Lapis Lazuli', lore: 'Wisdom in deep blue.', imageFileName: 'lapis_lazuli.png' },
  { id: 'moonstone', tier: 'uncommon', milestoneLevel: 35, name: 'Moonstone', lore: 'Quiet glow, late nights.', imageFileName: 'moonstone.png' },
  { id: 'carnelian', tier: 'uncommon', milestoneLevel: 40, name: 'Carnelian', lore: 'Fuel for the long hours.', imageFileName: 'carnelian.png' },

  // Tier 3 — Rare (faceted, deep saturation)
  { id: 'emerald', tier: 'rare', milestoneLevel: 45, name: 'Emerald', lore: 'Mastery, faceted.', imageFileName: 'emerald.png' },
  { id: 'ruby', tier: 'rare', milestoneLevel: 50, name: 'Ruby', lore: 'Earned in blood and time.', imageFileName: 'ruby.png' },
  { id: 'sapphire', tier: 'rare', milestoneLevel: 60, name: 'Sapphire', lore: 'Royal blue. Iron will.', imageFileName: 'sapphire.png' },
  { id: 'tanzanite', tier: 'rare', milestoneLevel: 70, name: 'Tanzanite', lore: 'Rare as a perfect day.', imageFileName: 'tanzanite.png' },
  { id: 'tourmaline', tier: 'rare', milestoneLevel: 80, name: 'Tourmaline', lore: 'Two states, one stone.', imageFileName: 'tourmaline.png' },
  { id: 'spinel', tier: 'rare', milestoneLevel: 90, name: 'Spinel', lore: 'Pure intensity.', imageFileName: 'spinel.png' },
  { id: 'imperial_topaz', tier: 'rare', milestoneLevel: 100, name: 'Imperial Topaz', lore: 'One hundred levels of fire.', imageFileName: 'imperial_topaz.png' },
  { id: 'diamond', tier: 'rare', milestoneLevel: 115, name: 'Diamond', lore: 'Forged by 100+ hours.', imageFileName: 'diamond.png' },

  // Tier 4 — Epic (iridescent, prismatic)
  { id: 'black_opal', tier: 'epic', milestoneLevel: 130, name: 'Black Opal', lore: 'A galaxy in your pocket.', imageFileName: 'black_opal.png' },
  { id: 'alexandrite', tier: 'epic', milestoneLevel: 150, name: 'Alexandrite', lore: 'Transforms with the light.', imageFileName: 'alexandrite.png' },
  { id: 'fire_opal', tier: 'epic', milestoneLevel: 175, name: 'Fire Opal', lore: 'Burns from within.', imageFileName: 'fire_opal.png' },
  { id: 'painite', tier: 'epic', milestoneLevel: 200, name: 'Painite', lore: 'One of the rarest things on Earth.', imageFileName: 'painite.png' },
  { id: 'tahitian_pearl', tier: 'epic', milestoneLevel: 250, name: 'Tahitian Pearl', lore: 'Pulled from depth.', imageFileName: 'tahitian_pearl.png' },

  // Tier 5 — Mythic (otherworldly)
  { id: 'void_prism', tier: 'mythic', milestoneLevel: 300, name: 'Void Prism', lore: 'The cosmos, contained.', imageFileName: 'void_prism.png' },
  { id: 'eclipse_stone', tier: 'mythic', milestoneLevel: 400, name: 'Eclipse Stone', lore: 'Forged in total stillness.', imageFileName: 'eclipse_stone.png' },
  { id: 'heart_of_focus', tier: 'mythic', milestoneLevel: 500, name: 'Heart of Focus', lore: 'Earned by one in ten thousand.', imageFileName: 'heart_of_focus.png' },
];

export const CRYSTALS_BY_LEVEL = [...CRYSTALS].sort((a, b) => a.milestoneLevel - b.milestoneLevel);

export function getCrystalById(id: string): CrystalDefinition | undefined {
  return CRYSTALS.find((c) => c.id === id);
}

// The next crystal milestone level strictly greater than `currentLevel`, or null if none remain.
export function nextCrystalLevel(currentLevel: number): CrystalDefinition | null {
  for (const c of CRYSTALS_BY_LEVEL) {
    if (c.milestoneLevel > currentLevel) return c;
  }
  return null;
}

// Whichever crystal corresponds to `currentLevel` (highest milestone ≤ currentLevel),
// used to label the user's "current tier" on the home card.
export function currentTierForLevel(currentLevel: number): CrystalTier | null {
  let result: CrystalTier | null = null;
  for (const c of CRYSTALS_BY_LEVEL) {
    if (c.milestoneLevel <= currentLevel) {
      result = c.tier;
    } else {
      break;
    }
  }
  return result;
}
