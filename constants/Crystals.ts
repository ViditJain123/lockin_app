// Trophy collection — 30 Lockin mascot figures across 5 rarity tiers, earned at
// milestone levels. Ids keep their original crystal names so earned trophies
// already stored on devices and in Supabase carry over unchanged.

import type { TrophyAccessory } from '@/components/MascotTrophy';

export type CrystalTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';

export interface CrystalDefinition {
  id: string;
  tier: CrystalTier;
  milestoneLevel: number;
  name: string;
  lore: string;
  accessory: TrophyAccessory;
  imageFileName: string; // file under assets/images/crystals/<tier>/
}

export const TIER_COLORS: Record<CrystalTier, string> = {
  common: '#B08A68',
  uncommon: '#D99A00',
  rare: '#FF6600',
  epic: '#E24300',
  mythic: '#0E0E0E',
};

export const TIER_LABELS: Record<CrystalTier, string> = {
  common: 'ROOKIE',
  uncommon: 'REGULAR',
  rare: 'PRO',
  epic: 'ELITE',
  mythic: 'LEGEND',
};

export const TIER_ORDER: CrystalTier[] = ['common', 'uncommon', 'rare', 'epic', 'mythic'];

export const CRYSTALS: CrystalDefinition[] = [
  // Tier 1 — Rookie (cream tile)
  { id: 'quartz', tier: 'common', milestoneLevel: 1, name: 'Rookie', lore: 'Day one. Phone down.', accessory: 'none', imageFileName: 'quartz.png' },
  { id: 'agate', tier: 'common', milestoneLevel: 2, name: 'Sprout', lore: 'A tiny habit, planted.', accessory: 'sprout', imageFileName: 'agate.png' },
  { id: 'citrine', tier: 'common', milestoneLevel: 3, name: 'Tuned Out', lore: 'Notifications? Never heard of them.', accessory: 'headphones', imageFileName: 'citrine.png' },
  { id: 'onyx', tier: 'common', milestoneLevel: 4, name: 'Night Owl', lore: 'Locked in after dark.', accessory: 'moon', imageFileName: 'onyx.png' },
  { id: 'jasper', tier: 'common', milestoneLevel: 5, name: 'Bookworm', lore: 'Read a page instead of a feed.', accessory: 'glasses', imageFileName: 'jasper.png' },
  { id: 'hematite', tier: 'common', milestoneLevel: 7, name: 'Grinder', lore: 'Sweat the small sessions.', accessory: 'sweatband', imageFileName: 'hematite.png' },

  // Tier 2 — Regular (yellow tile)
  { id: 'amethyst', tier: 'uncommon', milestoneLevel: 10, name: 'Coffee Run', lore: 'Fuel up, then lock in.', accessory: 'coffee', imageFileName: 'amethyst.png' },
  { id: 'peridot', tier: 'uncommon', milestoneLevel: 13, name: 'Coach', lore: 'You call the plays now.', accessory: 'cap', imageFileName: 'peridot.png' },
  { id: 'aquamarine', tier: 'uncommon', milestoneLevel: 16, name: 'Cool Head', lore: 'Unbothered by the scroll.', accessory: 'shades', imageFileName: 'aquamarine.png' },
  { id: 'topaz', tier: 'uncommon', milestoneLevel: 20, name: 'Charged', lore: 'Ten levels of pure voltage.', accessory: 'bolt', imageFileName: 'topaz.png' },
  { id: 'garnet', tier: 'uncommon', milestoneLevel: 25, name: 'On Fire', lore: 'The streak keeps burning.', accessory: 'flame', imageFileName: 'garnet.png' },
  { id: 'lapis_lazuli', tier: 'uncommon', milestoneLevel: 30, name: 'Cozy Grind', lore: 'Warm tea, cold phone.', accessory: 'scarf', imageFileName: 'lapis_lazuli.png' },
  { id: 'moonstone', tier: 'uncommon', milestoneLevel: 35, name: 'Lights Out', lore: 'Slept on time. Woke up ready.', accessory: 'nightcap', imageFileName: 'moonstone.png' },
  { id: 'carnelian', tier: 'uncommon', milestoneLevel: 40, name: 'Dressed Up', lore: 'Showing up like it matters.', accessory: 'bowtie', imageFileName: 'carnelian.png' },

  // Tier 3 — Pro (orange tile)
  { id: 'emerald', tier: 'rare', milestoneLevel: 45, name: 'Medalist', lore: 'Podium-level focus.', accessory: 'medal', imageFileName: 'emerald.png' },
  { id: 'ruby', tier: 'rare', milestoneLevel: 50, name: 'Star Pupil', lore: 'Fifty levels, zero doomscrolls.', accessory: 'star', imageFileName: 'ruby.png' },
  { id: 'sapphire', tier: 'rare', milestoneLevel: 60, name: 'Liftoff', lore: 'Momentum has left the atmosphere.', accessory: 'rocket', imageFileName: 'sapphire.png' },
  { id: 'tanzanite', tier: 'rare', milestoneLevel: 70, name: 'Laureate', lore: 'Crowned by consistency.', accessory: 'laurel', imageFileName: 'tanzanite.png' },
  { id: 'tourmaline', tier: 'rare', milestoneLevel: 80, name: 'Hero', lore: 'Saved a day from the feed.', accessory: 'cape', imageFileName: 'tourmaline.png' },
  { id: 'spinel', tier: 'rare', milestoneLevel: 90, name: 'Wizard', lore: 'Turns hours into magic.', accessory: 'wizard', imageFileName: 'spinel.png' },
  { id: 'imperial_topaz', tier: 'rare', milestoneLevel: 100, name: 'Centurion', lore: 'One hundred levels deep.', accessory: 'plume', imageFileName: 'imperial_topaz.png' },
  { id: 'diamond', tier: 'rare', milestoneLevel: 115, name: 'Diamond Hands', lore: 'Never let go of the habit.', accessory: 'diamond', imageFileName: 'diamond.png' },

  // Tier 4 — Elite (sunset tile)
  { id: 'black_opal', tier: 'epic', milestoneLevel: 130, name: 'Astronaut', lore: 'Orbiting far above the noise.', accessory: 'astronaut', imageFileName: 'black_opal.png' },
  { id: 'alexandrite', tier: 'epic', milestoneLevel: 150, name: 'Ninja', lore: 'Silent. Focused. Unseen.', accessory: 'ninja', imageFileName: 'alexandrite.png' },
  { id: 'fire_opal', tier: 'epic', milestoneLevel: 175, name: 'Phoenix', lore: 'Rose from the reels.', accessory: 'wings', imageFileName: 'fire_opal.png' },
  { id: 'painite', tier: 'epic', milestoneLevel: 200, name: 'Saint of Focus', lore: 'Pure, uninterrupted attention.', accessory: 'halo', imageFileName: 'painite.png' },
  { id: 'tahitian_pearl', tier: 'epic', milestoneLevel: 250, name: 'Crowned', lore: 'Royalty of the lock-in.', accessory: 'crown', imageFileName: 'tahitian_pearl.png' },

  // Tier 5 — Legend (ink tile)
  { id: 'void_prism', tier: 'mythic', milestoneLevel: 300, name: 'Golden', lore: 'Solid gold discipline.', accessory: 'golden', imageFileName: 'void_prism.png' },
  { id: 'eclipse_stone', tier: 'mythic', milestoneLevel: 400, name: 'Shadow', lore: 'Works in total stillness.', accessory: 'shadow', imageFileName: 'eclipse_stone.png' },
  { id: 'heart_of_focus', tier: 'mythic', milestoneLevel: 500, name: 'Legend', lore: 'Earned by one in ten thousand.', accessory: 'legend', imageFileName: 'heart_of_focus.png' },
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
