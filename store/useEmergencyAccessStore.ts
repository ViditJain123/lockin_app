/**
 * Emergency Access Store
 *
 * Manages emergency passes for the safety-valve system.
 *
 * - 1 free pass per day (10 minutes)
 * - Up to 3 paid passes per day ($0.99 each, 10 minutes)
 * - No debt/borrow system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';

// Storage key — bumped to v2 for clean migration from old weekly/debt model
const EMERGENCY_ACCESS_STORAGE_KEY = 'lockin-emergency-access-state-v2';

// Constants
const FREE_PASS_DURATION_MINUTES = 10;
const PAID_PASS_DURATION_MINUTES = 10;
const FREE_PASSES_PER_DAY = 1;
const MAX_PAID_PURCHASES_PER_DAY = 3;

interface EmergencySession {
  startedAt: string; // ISO string
  expiresAt: string; // ISO string
  type: 'free' | 'paid';
}

interface EmergencyAccessState {
  // Persisted state
  freePassUsedToday: boolean;
  paidPurchasesToday: number; // 0–3
  lastResetDateString: string; // "YYYY-MM-DD"

  // Non-persisted — cleaned up on foreground
  activeSession: EmergencySession | null;

  // Hydration
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  checkAndResetForNewDay: () => void;
  consumeFreePass: () => boolean;
  consumePaidPass: () => boolean;
  cleanupExpiredSessions: () => boolean;

  // Getters
  hasFreePass: () => boolean;
  canPurchase: () => boolean;
  purchasesRemainingToday: () => number;
  hasActiveSession: () => boolean;
  hasReachedDailyMax: () => boolean;
}

export const useEmergencyAccessStore = create<EmergencyAccessState>()(
  persist(
    (set, get) => ({
      freePassUsedToday: false,
      paidPurchasesToday: 0,
      lastResetDateString: getLocalDateString(),
      activeSession: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      /**
       * Reset passes if it's a new calendar day (local timezone)
       */
      checkAndResetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDateString } = get();

        if (today !== lastResetDateString) {
          console.log(`[EmergencyAccess] New day (${lastResetDateString} -> ${today}), resetting passes`);
          set({
            freePassUsedToday: false,
            paidPurchasesToday: 0,
            lastResetDateString: today,
          });
        }
      },

      /**
       * Use the daily free emergency pass (10 min)
       * @returns true if pass was consumed
       */
      consumeFreePass: () => {
        const { freePassUsedToday, activeSession } = get();

        if (activeSession) {
          console.log('[EmergencyAccess] Already in an active session');
          return false;
        }

        if (freePassUsedToday) {
          console.log('[EmergencyAccess] Free pass already used today');
          return false;
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + FREE_PASS_DURATION_MINUTES * 60 * 1000);

        set({
          freePassUsedToday: true,
          activeSession: {
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            type: 'free',
          },
        });

        console.log(`[EmergencyAccess] Free pass consumed, expires at ${expiresAt.toLocaleTimeString()}`);
        return true;
      },

      /**
       * Use a paid emergency pass (10 min). Call AFTER IAP succeeds.
       * @returns true if pass was consumed
       */
      consumePaidPass: () => {
        const { paidPurchasesToday, activeSession } = get();

        if (activeSession) {
          console.log('[EmergencyAccess] Already in an active session');
          return false;
        }

        if (paidPurchasesToday >= MAX_PAID_PURCHASES_PER_DAY) {
          console.log('[EmergencyAccess] Max paid purchases reached today');
          return false;
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + PAID_PASS_DURATION_MINUTES * 60 * 1000);

        set({
          paidPurchasesToday: paidPurchasesToday + 1,
          activeSession: {
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            type: 'paid',
          },
        });

        console.log(`[EmergencyAccess] Paid pass consumed (${paidPurchasesToday + 1}/${MAX_PAID_PURCHASES_PER_DAY}), expires at ${expiresAt.toLocaleTimeString()}`);
        return true;
      },

      /**
       * Clean up expired sessions
       * @returns true if a session was cleaned up (apps should re-block)
       */
      cleanupExpiredSessions: () => {
        const { activeSession } = get();
        if (activeSession && new Date(activeSession.expiresAt).getTime() < Date.now()) {
          set({ activeSession: null });
          console.log('[EmergencyAccess] Cleaned up expired session');
          return true;
        }
        return false;
      },

      // Getters
      hasFreePass: () => {
        return !get().freePassUsedToday;
      },

      canPurchase: () => {
        return get().paidPurchasesToday < MAX_PAID_PURCHASES_PER_DAY;
      },

      purchasesRemainingToday: () => {
        return MAX_PAID_PURCHASES_PER_DAY - get().paidPurchasesToday;
      },

      hasActiveSession: () => {
        return get().activeSession !== null;
      },

      hasReachedDailyMax: () => {
        const { freePassUsedToday, paidPurchasesToday } = get();
        return freePassUsedToday && paidPurchasesToday >= MAX_PAID_PURCHASES_PER_DAY;
      },
    }),
    {
      name: EMERGENCY_ACCESS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        freePassUsedToday: state.freePassUsedToday,
        paidPurchasesToday: state.paidPurchasesToday,
        lastResetDateString: state.lastResetDateString,
        // activeSession is NOT persisted — cleaned up on foreground
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.checkAndResetForNewDay();
      },
    }
  )
);

// Export constants for use in other files
export {
  FREE_PASS_DURATION_MINUTES,
  PAID_PASS_DURATION_MINUTES,
  FREE_PASSES_PER_DAY,
  MAX_PAID_PURCHASES_PER_DAY,
};
