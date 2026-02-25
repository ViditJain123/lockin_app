import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BADGES, BadgeDefinition, getBadgeById } from '@/constants/Badges';
import { pushNewBadges, pullUserBadges } from '../lib/syncService';
import { supabase } from '../lib/supabase';

// Storage key
const BADGE_STORAGE_KEY = 'lockin-badge-state';

// Stats interface for checking badge eligibility
export interface BadgeStats {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
}

// Earned badge with timestamp
export interface EarnedBadge {
  badgeId: string;
  earnedAt: number; // timestamp
}

interface BadgeState {
  // Earned badges list
  earnedBadges: EarnedBadge[];
  // Badges pending to be shown in modal (newly earned)
  pendingNewBadges: string[];
  // Hydration state
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  checkAndAwardBadges: (stats: BadgeStats) => string[];
  claimBadge: (badgeId: string) => void;
  markBadgeAsSeen: (badgeId: string) => void;
  markAllBadgesAsSeen: () => void;
  hasBadge: (badgeId: string) => boolean;
  getEarnedBadgeIds: () => string[];
  getRecentlyEarnedBadges: (count: number) => BadgeDefinition[];
  resetBadges: () => void;

  // Sync actions
  syncBadgesToSupabase: (newBadges: EarnedBadge[]) => Promise<void>;
  loadBadgesFromSupabase: () => Promise<void>;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      earnedBadges: [],
      pendingNewBadges: [],
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Check stats against thresholds and award new badges
      // Returns array of newly awarded badge IDs
      checkAndAwardBadges: (stats: BadgeStats): string[] => {
        const { earnedBadges } = get();
        const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));
        const newlyEarned: string[] = [];
        const now = Date.now();

        for (const badge of BADGES) {
          // Skip if already earned
          if (earnedIds.has(badge.id)) continue;

          // Check if threshold is met based on category
          let earned = false;
          switch (badge.category) {
            case 'hours':
              earned = stats.totalHours >= badge.threshold;
              break;
            case 'grinds':
              earned = stats.totalGrinds >= badge.threshold;
              break;
            case 'streak':
              earned = stats.currentStreak >= badge.threshold;
              break;
          }

          if (earned) {
            newlyEarned.push(badge.id);
          }
        }

        // Update state with newly earned badges
        if (newlyEarned.length > 0) {
          const newEarnedBadges: EarnedBadge[] = newlyEarned.map((id) => ({
            badgeId: id,
            earnedAt: now,
          }));

          set((state) => ({
            earnedBadges: [...state.earnedBadges, ...newEarnedBadges],
            pendingNewBadges: [...state.pendingNewBadges, ...newlyEarned],
          }));

          // Fire-and-forget sync to Supabase
          get().syncBadgesToSupabase(newEarnedBadges);
        }

        return newlyEarned;
      },

      // Claim a single badge (for retroactive badge claiming)
      claimBadge: (badgeId: string) => {
        const { earnedBadges } = get();
        if (earnedBadges.some((eb) => eb.badgeId === badgeId)) return; // Already earned

        const newEarned: EarnedBadge = { badgeId, earnedAt: Date.now() };
        set({ earnedBadges: [...earnedBadges, newEarned] });
      },

      // Remove a badge from pending list after modal shown
      markBadgeAsSeen: (badgeId: string) => {
        set((state) => ({
          pendingNewBadges: state.pendingNewBadges.filter((id) => id !== badgeId),
        }));
      },

      // Clear all pending badges
      markAllBadgesAsSeen: () => {
        set({ pendingNewBadges: [] });
      },

      // Check if a specific badge is earned
      hasBadge: (badgeId: string): boolean => {
        const { earnedBadges } = get();
        return earnedBadges.some((eb) => eb.badgeId === badgeId);
      },

      // Get all earned badge IDs
      getEarnedBadgeIds: (): string[] => {
        const { earnedBadges } = get();
        return earnedBadges.map((eb) => eb.badgeId);
      },

      // Get the N most recently earned badges (for featured display)
      getRecentlyEarnedBadges: (count: number): BadgeDefinition[] => {
        const { earnedBadges } = get();
        // Sort by earnedAt descending (most recent first)
        const sorted = [...earnedBadges].sort((a, b) => b.earnedAt - a.earnedAt);
        const recentIds = sorted.slice(0, count).map((eb) => eb.badgeId);

        // Map to badge definitions
        return recentIds
          .map((id) => getBadgeById(id))
          .filter((b): b is BadgeDefinition => b !== undefined);
      },

      // Reset all badges (for testing/debugging)
      resetBadges: () => {
        set({
          earnedBadges: [],
          pendingNewBadges: [],
        });
      },

      // Push newly earned badges to Supabase
      syncBadgesToSupabase: async (newBadges: EarnedBadge[]) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          await pushNewBadges(session.user.id, newBadges);
        } catch (err) {
          console.error('[BadgeStore] syncBadgesToSupabase error:', err);
        }
      },

      // Pull badges from Supabase and merge (union of local + remote)
      loadBadgesFromSupabase: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const remoteBadges = await pullUserBadges(session.user.id);
          if (remoteBadges.length === 0) return;

          const { earnedBadges } = get();
          const localIds = new Set(earnedBadges.map((b) => b.badgeId));

          // Add any remote badges we don't have locally
          const newFromRemote = remoteBadges.filter((rb) => !localIds.has(rb.badgeId));
          if (newFromRemote.length > 0) {
            set((state) => ({
              earnedBadges: [...state.earnedBadges, ...newFromRemote],
            }));
          }
        } catch (err) {
          console.error('[BadgeStore] loadBadgesFromSupabase error:', err);
        }
      },
    }),
    {
      name: BADGE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        earnedBadges: state.earnedBadges,
        // Don't persist pendingNewBadges - if app closes, they should still show next time
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks for optimized subscriptions
export const useEarnedBadges = () => useBadgeStore((s) => s.earnedBadges);
export const usePendingNewBadges = () => useBadgeStore((s) => s.pendingNewBadges);
export const useHasBadge = (badgeId: string) =>
  useBadgeStore((s) => s.earnedBadges.some((eb) => eb.badgeId === badgeId));
