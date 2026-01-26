import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  checkForAppUpdate,
  openAppStore,
  UpdateCheckResult,
  UpdateType,
} from '../lib/appUpdateService';

// Storage key
const APP_UPDATE_STORAGE_KEY = 'lockin-app-update-state';

// Check at most once per 24 hours
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Don't show soft update banner again for 24 hours after dismissal
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AppUpdateState {
  // Update status
  updateType: UpdateType;
  currentVersion: string;
  latestVersion: string;
  updateMessage: string;
  appStoreUrl: string;

  // UI state
  isChecking: boolean;
  showForceUpdateModal: boolean;
  showSoftUpdateBanner: boolean;

  // Timestamps for rate limiting
  lastCheckTime: number | null;
  lastDismissTime: number | null;

  // Store hydration
  _hasHydrated: boolean;

  // Actions
  checkForUpdate: (force?: boolean) => Promise<void>;
  dismissSoftUpdate: () => void;
  openStore: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
  reset: () => void;
}

export const useAppUpdateStore = create<AppUpdateState>()(
  persist(
    (set, get) => ({
      // Initial state
      updateType: 'none',
      currentVersion: '',
      latestVersion: '',
      updateMessage: '',
      appStoreUrl: '',
      isChecking: false,
      showForceUpdateModal: false,
      showSoftUpdateBanner: false,
      lastCheckTime: null,
      lastDismissTime: null,
      _hasHydrated: false,

      // Check for app updates
      checkForUpdate: async (force = false) => {
        const state = get();

        // Skip if already checking
        if (state.isChecking) {
          console.log('[AppUpdate] Already checking, skipping');
          return;
        }

        // Rate limit: only check once per CHECK_INTERVAL_MS (unless forced)
        if (!force && state.lastCheckTime) {
          const timeSinceLastCheck = Date.now() - state.lastCheckTime;
          if (timeSinceLastCheck < CHECK_INTERVAL_MS) {
            console.log(
              `[AppUpdate] Skipping check, last check was ${Math.round(
                timeSinceLastCheck / 60000
              )} minutes ago`
            );

            // Still show modals/banners based on cached state
            if (state.updateType === 'force') {
              set({ showForceUpdateModal: true });
            } else if (state.updateType === 'soft') {
              // Only show banner if not recently dismissed
              const timeSinceDismiss = state.lastDismissTime
                ? Date.now() - state.lastDismissTime
                : Infinity;
              if (timeSinceDismiss >= DISMISS_DURATION_MS) {
                set({ showSoftUpdateBanner: true });
              }
            }
            return;
          }
        }

        set({ isChecking: true });

        try {
          const result: UpdateCheckResult = await checkForAppUpdate();

          const newState: Partial<AppUpdateState> = {
            updateType: result.updateType,
            currentVersion: result.currentVersion,
            latestVersion: result.latestVersion,
            updateMessage: result.message,
            appStoreUrl: result.appStoreUrl,
            isChecking: false,
            lastCheckTime: Date.now(),
          };

          // Show appropriate UI based on update type
          if (result.updateType === 'force') {
            newState.showForceUpdateModal = true;
            newState.showSoftUpdateBanner = false;
          } else if (result.updateType === 'soft') {
            newState.showForceUpdateModal = false;
            // Only show banner if not recently dismissed
            const timeSinceDismiss = state.lastDismissTime
              ? Date.now() - state.lastDismissTime
              : Infinity;
            newState.showSoftUpdateBanner = timeSinceDismiss >= DISMISS_DURATION_MS;
          } else {
            newState.showForceUpdateModal = false;
            newState.showSoftUpdateBanner = false;
          }

          set(newState);
          console.log('[AppUpdate] Check complete:', result.updateType);
        } catch (error) {
          console.error('[AppUpdate] Error during update check:', error);
          set({ isChecking: false });
        }
      },

      // Dismiss soft update banner (won't show again for DISMISS_DURATION_MS)
      dismissSoftUpdate: () => {
        set({
          showSoftUpdateBanner: false,
          lastDismissTime: Date.now(),
        });
        console.log('[AppUpdate] Soft update dismissed');
      },

      // Open the app store
      openStore: async () => {
        const { appStoreUrl } = get();
        await openAppStore(appStoreUrl);
      },

      // Set hydration state
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Reset store
      reset: () => {
        set({
          updateType: 'none',
          currentVersion: '',
          latestVersion: '',
          updateMessage: '',
          appStoreUrl: '',
          isChecking: false,
          showForceUpdateModal: false,
          showSoftUpdateBanner: false,
          lastCheckTime: null,
          lastDismissTime: null,
        });
      },
    }),
    {
      name: APP_UPDATE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist these values for rate limiting and cached state
        updateType: state.updateType,
        currentVersion: state.currentVersion,
        latestVersion: state.latestVersion,
        updateMessage: state.updateMessage,
        appStoreUrl: state.appStoreUrl,
        lastCheckTime: state.lastCheckTime,
        lastDismissTime: state.lastDismissTime,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks
export const useShowForceUpdateModal = () =>
  useAppUpdateStore((state) => state.showForceUpdateModal);
export const useShowSoftUpdateBanner = () =>
  useAppUpdateStore((state) => state.showSoftUpdateBanner);
export const useUpdateMessage = () => useAppUpdateStore((state) => state.updateMessage);
export const useLatestVersion = () => useAppUpdateStore((state) => state.latestVersion);
