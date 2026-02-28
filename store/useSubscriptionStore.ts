import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { type CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { scheduleTrialEndNotification, cancelTrialEndNotification } from '../lib/notificationService';

// Storage key
const SUBSCRIPTION_STORAGE_KEY = 'lockin-subscription-state';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'appl_UjCZpUjBoKjZaaaLihwedqiSwhU';

// Entitlement identifier (must match RevenueCat dashboard)
export const ENTITLEMENT_ID = 'Lockin Club Pro';

// Product identifiers for reference
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

// Subscription info interface
export interface SubscriptionInfo {
  isActive: boolean;
  productIdentifier: string | null;
  expirationDate: string | null;
  willRenew: boolean;
  periodType: string | null;
}

interface SubscriptionState {
  // Subscription status
  isSubscribed: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  customerInfo: CustomerInfo | null;

  // Loading states
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Error state
  error: string | null;

  // Initialization state
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<boolean>;
  presentPaywall: () => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// Helper to extract subscription info from CustomerInfo
function extractSubscriptionInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isActive: false,
      productIdentifier: null,
      expirationDate: null,
      willRenew: false,
      periodType: null,
    };
  }

  return {
    isActive: true,
    productIdentifier: entitlement.productIdentifier,
    expirationDate: entitlement.expirationDate,
    willRenew: entitlement.willRenew,
    periodType: entitlement.periodType,
  };
}

// Helper to get user-friendly error message
function getErrorMessage(error: any): string {
  if (error?.userCancelled) {
    return 'Purchase was cancelled';
  }

  if (error?.code) {
    switch (error.code) {
      case 1:
        return 'Purchase was cancelled';
      case 2:
        return 'There was a problem with the App Store. Please try again.';
      case 3:
        return 'Purchases are not allowed on this device';
      case 5:
        return 'This product is not available for purchase';
      case 6:
        return 'You already own this subscription';
      case 10:
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  return error?.message || 'An unexpected error occurred';
}

// Helper to schedule or cancel trial notification based on subscription info
function handleTrialNotification(subscriptionInfo: SubscriptionInfo): void {
  if (subscriptionInfo.periodType === 'TRIAL' && subscriptionInfo.expirationDate) {
    scheduleTrialEndNotification(subscriptionInfo.expirationDate).catch((err) =>
      console.error('[Subscription] Failed to schedule trial notification:', err)
    );
  } else {
    cancelTrialEndNotification().catch((err) =>
      console.error('[Subscription] Failed to cancel trial notification:', err)
    );
  }
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      subscriptionInfo: null,
      customerInfo: null,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      error: null,
      isInitialized: false,

      // Initialize RevenueCat SDK
      initialize: async () => {
        if (get().isInitialized) {
          console.log('[Subscription] Already initialized');
          return;
        }

        try {
          console.log('[Subscription] Initializing RevenueCat...');

          // Set log level for debugging
          if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
          }

          // Configure RevenueCat with platform-specific key
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          }

          // Set up customer info listener for real-time updates
          Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            console.log('[Subscription] Customer info updated');
            const subscriptionInfo = extractSubscriptionInfo(customerInfo);
            set({
              customerInfo,
              subscriptionInfo,
              isSubscribed: subscriptionInfo.isActive,
            });
            handleTrialNotification(subscriptionInfo);
          });

          // Get initial customer info
          const customerInfo = await Purchases.getCustomerInfo();
          const subscriptionInfo = extractSubscriptionInfo(customerInfo);

          set({
            isInitialized: true,
            customerInfo,
            subscriptionInfo,
            isSubscribed: subscriptionInfo.isActive,
          });

          handleTrialNotification(subscriptionInfo);

          console.log('[Subscription] RevenueCat initialized, subscribed:', subscriptionInfo.isActive);
        } catch (error) {
          console.error('[Subscription] Error initializing:', error);
          set({ isInitialized: true }); // Mark as initialized even on error to prevent retries
        }
      },

      // Check current subscription status
      checkSubscriptionStatus: async (): Promise<boolean> => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const subscriptionInfo = extractSubscriptionInfo(customerInfo);

          set({
            customerInfo,
            subscriptionInfo,
            isSubscribed: subscriptionInfo.isActive,
          });

          console.log('[Subscription] Status checked, subscribed:', subscriptionInfo.isActive);
          return subscriptionInfo.isActive;
        } catch (error) {
          console.error('[Subscription] Error checking status:', error);
          return get().isSubscribed; // Return cached value on error
        }
      },

      // Present RevenueCat Paywall
      presentPaywall: async (): Promise<boolean> => {
        set({ isPurchasing: true, error: null });

        try {
          console.log('[Subscription] Presenting paywall...');
          const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

          console.log('[Subscription] Paywall result:', paywallResult);

          switch (paywallResult) {
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
              // Refresh customer info
              const customerInfo = await Purchases.getCustomerInfo();
              const subscriptionInfo = extractSubscriptionInfo(customerInfo);
              set({
                customerInfo,
                subscriptionInfo,
                isSubscribed: subscriptionInfo.isActive,
                isPurchasing: false,
              });
              handleTrialNotification(subscriptionInfo);
              return true;

            case PAYWALL_RESULT.NOT_PRESENTED:
            case PAYWALL_RESULT.ERROR:
            case PAYWALL_RESULT.CANCELLED:
            default:
              set({ isPurchasing: false });
              return false;
          }
        } catch (error: any) {
          console.error('[Subscription] Paywall error:', error);
          const errorMessage = getErrorMessage(error);
          set({ error: errorMessage, isPurchasing: false });
          return false;
        }
      },

      // Present paywall only if user doesn't have active entitlement
      presentPaywallIfNeeded: async (): Promise<boolean> => {
        set({ isPurchasing: true, error: null });

        try {
          console.log('[Subscription] Presenting paywall if needed...');
          const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: ENTITLEMENT_ID,
          });

          console.log('[Subscription] Paywall result:', paywallResult);

          switch (paywallResult) {
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
              // Refresh customer info
              const customerInfo = await Purchases.getCustomerInfo();
              const subscriptionInfo = extractSubscriptionInfo(customerInfo);
              set({
                customerInfo,
                subscriptionInfo,
                isSubscribed: subscriptionInfo.isActive,
                isPurchasing: false,
              });
              return true;

            case PAYWALL_RESULT.NOT_PRESENTED:
              // User already has entitlement
              set({ isPurchasing: false });
              return true;

            case PAYWALL_RESULT.ERROR:
            case PAYWALL_RESULT.CANCELLED:
            default:
              set({ isPurchasing: false });
              return false;
          }
        } catch (error: any) {
          console.error('[Subscription] Paywall error:', error);
          const errorMessage = getErrorMessage(error);
          set({ error: errorMessage, isPurchasing: false });
          return false;
        }
      },

      // Restore purchases
      restorePurchases: async (): Promise<boolean> => {
        set({ isRestoring: true, error: null });

        try {
          console.log('[Subscription] Restoring purchases...');
          const customerInfo = await Purchases.restorePurchases();
          const subscriptionInfo = extractSubscriptionInfo(customerInfo);

          set({
            customerInfo,
            subscriptionInfo,
            isSubscribed: subscriptionInfo.isActive,
            isRestoring: false,
          });

          console.log('[Subscription] Restore complete, subscribed:', subscriptionInfo.isActive);
          return subscriptionInfo.isActive;
        } catch (error: any) {
          console.error('[Subscription] Restore error:', error);
          const errorMessage = getErrorMessage(error);
          set({ error: errorMessage, isRestoring: false });
          return false;
        }
      },

      // Login user to RevenueCat (call after Supabase auth)
      loginUser: async (userId: string) => {
        try {
          console.log('[Subscription] Logging in user:', userId);
          const { customerInfo } = await Purchases.logIn(userId);
          const subscriptionInfo = extractSubscriptionInfo(customerInfo);

          set({
            customerInfo,
            subscriptionInfo,
            isSubscribed: subscriptionInfo.isActive,
          });
        } catch (error) {
          console.error('[Subscription] Login error:', error);
        }
      },

      // Logout user from RevenueCat (call on sign out)
      logoutUser: async () => {
        try {
          console.log('[Subscription] Logging out user');
          const customerInfo = await Purchases.logOut();
          const subscriptionInfo = extractSubscriptionInfo(customerInfo);

          set({
            customerInfo,
            subscriptionInfo,
            isSubscribed: subscriptionInfo.isActive,
          });
        } catch (error) {
          console.error('[Subscription] Logout error:', error);
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store (for logout)
      reset: () => {
        set({
          isSubscribed: false,
          subscriptionInfo: null,
          customerInfo: null,
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

// Selector hooks for common use cases
export const useIsSubscribed = () => useSubscriptionStore((state) => state.isSubscribed);
export const useSubscriptionLoading = () =>
  useSubscriptionStore((state) => state.isLoading || state.isPurchasing || state.isRestoring);
