// Lockin XP — single linear progression metric driving the crystal collection.
//
// xp = totalSeconds * 1 + completedGrinds * 500
//   - 1 XP per second of recorded focus time (live wheel motion during sessions)
//   - 500 XP bonus per completed grind (1+ hour session, matching the existing definition)
//
// Level curve: cumulative XP to *reach* level N is 100 * N^2.
// Lv 1 = 100 XP (≈ 100s of focus → first crystal lands inside first session).
// Lv 100 = 1,000,000 XP (≈ 280 hours).
// No hard cap.

export interface XPStats {
  totalHours: number;
  totalGrinds: number;
}

export const XP_PER_SECOND = 1;
export const XP_PER_GRIND_BONUS = 500;
export const LEVEL_COEFFICIENT = 100;

export function computeXP(stats: XPStats): number {
  const seconds = Math.max(0, stats.totalHours) * 3600;
  const grindBonus = Math.max(0, stats.totalGrinds) * XP_PER_GRIND_BONUS;
  return Math.floor(seconds * XP_PER_SECOND + grindBonus);
}

export function xpRequiredForLevel(level: number): number {
  if (level <= 0) return 0;
  return LEVEL_COEFFICIENT * level * level;
}

export function levelFromXP(xp: number): number {
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / LEVEL_COEFFICIENT));
}

// XP earned within the current level (between currentLevel boundary and next).
export function xpProgressInLevel(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  fraction: number;
} {
  const level = levelFromXP(xp);
  const base = xpRequiredForLevel(level);
  const next = xpRequiredForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xp - base);
  const xpForNextLevel = next - base;
  const fraction = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 0;
  return { level, xpIntoLevel, xpForNextLevel, fraction };
}
