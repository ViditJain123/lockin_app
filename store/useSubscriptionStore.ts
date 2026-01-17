import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from 'react-native-purchases';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  ENTITLEMENT_ID,
  hasActiveEntitlement,
  addCustomerInfoListener,
} from '../lib/revenueCat';

// Storage key
const SUBSCRIPTION_STORAGE_KEY = 'lockin-subscription-state';

// Error messages for user display
const ERROR_MESSAGES: Record<string, string> = {
  [PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR]: 'Purchase was cancelled',
  [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]: 'Purchase not allowed on this device',
  [PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR]: 'The purchase was invalid',
  [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]: 'Product not available for purchase',
  [PURCHASES_ERROR_CODE.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR]: 'There was a problem with the App Store. Please try again.',
};

interface SubscriptionState {
  // Subscription status
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;

  // Offerings (available packages)
  offerings: PurchasesOfferings | null;

  // Loading states
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Error state
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<boolean>;
  updateCustomerInfo: (customerInfo: CustomerInfo) => void;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      customerInfo: null,
      offerings: null,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      error: null,

      // Initialize and set up listener for customer info updates
      initialize: async () => {
        try {
          // Fetch initial customer info
          const customerInfo = await Purchases.getCustomerInfo();
          const isSubscribed = hasActiveEntitlement(customerInfo);

          set({ customerInfo, isSubscribed });

          // Set up listener for real-time updates
          addCustomerInfoListener((updatedInfo) => {
            const updatedSubscribed = hasActiveEntitlement(updatedInfo);
            set({
              customerInfo: updatedInfo,
              isSubscribed: updatedSubscribed,
            });
            console.log('[Subscription] Customer info updated, subscribed:', updatedSubscribed);
          });

          console.log('[Subscription] Initialized, subscribed:', isSubscribed);
        } catch (error) {
          console.error('[Subscription] Error initializing:', error);
        }
      },

      // Fetch available subscription packages
      fetchOfferings: async () => {
        set({ isLoading: true, error: null });
        try {
          const offerings = await Purchases.getOfferings();
          set({ offerings, isLoading: false });

          if (!offerings.current) {
            console.warn('[Subscription] No current offering configured');
          } else {
            console.log(
              '[Subscription] Offerings fetched:',
              offerings.current.availablePackages.map((p) => p.identifier)
            );
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error('[Subscription] Error fetching offerings:', error);
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Purchase a package
      purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
        set({ isPurchasing: true, error: null });
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const isSubscribed = hasActiveEntitlement(customerInfo);

          set({
            customerInfo,
            isSubscribed,
            isPurchasing: false,
          });

          console.log('[Subscription] Purchase successful, subscribed:', isSubscribed);
          return isSubscribed;
        } catch (error) {
          const purchaseError = error as PurchasesError;

          // User cancelled - not an error
          if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
            console.log('[Subscription] User cancelled purchase');
            set({ isPurchasing: false });
            return false;
          }

          const errorMessage = getErrorMessage(error);
          console.error('[Subscription] Purchase error:', error);
          set({ error: errorMessage, isPurchasing: false });
          return false;
        }
      },

      // Restore previous purchases
      restorePurchases: async (): Promise<boolean> => {
        set({ isRestoring: true, error: null });
        try {
          const customerInfo = await Purchases.restorePurchases();
          const isSubscribed = hasActiveEntitlement(customerInfo);

          set({
            customerInfo,
            isSubscribed,
            isRestoring: false,
          });

          console.log('[Subscription] Restore successful, subscribed:', isSubscribed);
          return isSubscribed;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error('[Subscription] Restore error:', error);
          set({ error: errorMessage, isRestoring: false });
          return false;
        }
      },

      // Check current subscription status
      checkSubscriptionStatus: async (): Promise<boolean> => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const isSubscribed = hasActiveEntitlement(customerInfo);

          set({
            customerInfo,
            isSubscribed,
          });

          console.log('[Subscription] Status checked, subscribed:', isSubscribed);
          return isSubscribed;
        } catch (error) {
          console.error('[Subscription] Error checking status:', error);
          return get().isSubscribed; // Return cached value on error
        }
      },

      // Update customer info (called by listener)
      updateCustomerInfo: (customerInfo: CustomerInfo) => {
        const isSubscribed = hasActiveEntitlement(customerInfo);
        set({ customerInfo, isSubscribed });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store (for logout)
      reset: () => {
        set({
          isSubscribed: false,
          customerInfo: null,
          offerings: null,
          isLoading: false,
          isPurchasing: false,
          isRestoring: false,
          error: null,
        });
      },
    }),
    {
      name: SUBSCRIPTION_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist subscription status for quick UI rendering
        isSubscribed: state.isSubscribed,
      }),
    }
  )
);

// Helper to get user-friendly error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const purchaseError = error as PurchasesError;
    if (purchaseError.code && ERROR_MESSAGES[purchaseError.code]) {
      return ERROR_MESSAGES[purchaseError.code];
    }
    return purchaseError.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}

// Selector hooks for common use cases
export const useIsSubscribed = () => useSubscriptionStore((state) => state.isSubscribed);
export const useSubscriptionLoading = () =>
  useSubscriptionStore((state) => state.isLoading || state.isPurchasing || state.isRestoring);
