import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  CRYSTALS,
  CrystalDefinition,
  getCrystalById,
} from '@/constants/Crystals';
import { computeXP, levelFromXP, type XPStats } from '@/lib/xp';

const ALL_CRYSTALS_UNLOCKED = false;

const CRYSTAL_STORAGE_KEY = 'lockin-crystal-state';
const PERSIST_VERSION = 2; // bumped from old badge schema (v0/v1) to force migration

export interface EarnedCrystal {
  crystalId: string;
  earnedAt: number;
}

interface CrystalState {
  earnedCrystals: EarnedCrystal[];
  pendingNewCrystals: string[];
  // Last known level — used to fire LevelUpToast when this changes.
  lastSeenLevel: number;
  // True when the store has rehydrated from disk.
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  // Awards any crystals whose milestoneLevel <= currentLevel and not yet earned.
  // Returns: { newlyEarned: ids, leveledUp: bool, newLevel }
  checkAndAwardCrystals: (stats: XPStats) => {
    newlyEarned: string[];
    leveledUp: boolean;
    newLevel: number;
  };
  markCrystalAsSeen: (crystalId: string) => void;
  markAllCrystalsAsSeen: () => void;
  consumeLevelUp: () => void;
  hasCrystal: (crystalId: string) => boolean;
  getEarnedCrystalIds: () => string[];
  resetCrystals: () => void;
  updateFromRemote: (crystals: EarnedCrystal[]) => void;
}

export const useCrystalStore = create<CrystalState>()(
  persist(
    (set, get) => ({
      earnedCrystals: [],
      pendingNewCrystals: [],
      lastSeenLevel: 0,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      checkAndAwardCrystals: (stats) => {
        const xp = computeXP(stats);
        const newLevel = levelFromXP(xp);
        const { earnedCrystals, lastSeenLevel } = get();
        const earnedIds = new Set(earnedCrystals.map((ec) => ec.crystalId));

        const newlyEarned: string[] = [];
        const now = Date.now();

        for (const crystal of CRYSTALS) {
          if (earnedIds.has(crystal.id)) continue;
          if (newLevel >= crystal.milestoneLevel) {
            newlyEarned.push(crystal.id);
          }
        }

        if (newlyEarned.length > 0 || newLevel !== lastSeenLevel) {
          set((state) => ({
            earnedCrystals:
              newlyEarned.length > 0
                ? [
                    ...state.earnedCrystals,
                    ...newlyEarned.map((id) => ({ crystalId: id, earnedAt: now })),
                  ]
                : state.earnedCrystals,
            pendingNewCrystals:
              newlyEarned.length > 0
                ? [...state.pendingNewCrystals, ...newlyEarned]
                : state.pendingNewCrystals,
            lastSeenLevel: newLevel,
          }));
        }

        return {
          newlyEarned,
          leveledUp: newLevel > lastSeenLevel,
          newLevel,
        };
      },

      markCrystalAsSeen: (crystalId) => {
        set((state) => ({
          pendingNewCrystals: state.pendingNewCrystals.filter((id) => id !== crystalId),
        }));
      },

      markAllCrystalsAsSeen: () => set({ pendingNewCrystals: [] }),

      consumeLevelUp: () => {
        // No-op placeholder kept for future expansion (e.g., a separate level-up queue).
        // Today the toast renders inline off the level diff and clears itself.
      },

      hasCrystal: (crystalId) => {
        if (ALL_CRYSTALS_UNLOCKED) return true;
        return get().earnedCrystals.some((ec) => ec.crystalId === crystalId);
      },

      getEarnedCrystalIds: () => get().earnedCrystals.map((ec) => ec.crystalId),

      resetCrystals: () =>
        set({ earnedCrystals: [], pendingNewCrystals: [], lastSeenLevel: 0 }),

      updateFromRemote: (crystals) => set({ earnedCrystals: crystals }),
    }),
    {
      name: CRYSTAL_STORAGE_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        earnedCrystals: state.earnedCrystals,
        lastSeenLevel: state.lastSeenLevel,
      }),
      // Old badge schema lived under a different storage key (`lockin-badge-state`),
      // so a fresh user of this store starts empty — the next `checkAndAwardCrystals`
      // call (driven by current XP) reawards anything they qualify for.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useEarnedCrystals = () => useCrystalStore((s) => s.earnedCrystals);
export const usePendingNewCrystals = () => useCrystalStore((s) => s.pendingNewCrystals);
export const useHasCrystal = (crystalId: string) =>
  useCrystalStore((s) => s.earnedCrystals.some((ec) => ec.crystalId === crystalId));

export function getRecentlyEarnedCrystals(count: number): CrystalDefinition[] {
  if (ALL_CRYSTALS_UNLOCKED) return CRYSTALS.slice(0, count);
  const { earnedCrystals } = useCrystalStore.getState();
  const sorted = [...earnedCrystals].sort((a, b) => b.earnedAt - a.earnedAt);
  return sorted
    .slice(0, count)
    .map((ec) => getCrystalById(ec.crystalId))
    .filter((c): c is CrystalDefinition => c !== undefined);
}
