import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Purchase, type PurchaseError, ErrorCode } from 'react-native-iap';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  initializeIAP,
  getProducts,
  purchaseProduct,
  restorePurchases,
  validateReceipt,
  finishPurchaseTransaction,
  checkSubscriptionStatus,
  setupPurchaseListeners,
  cleanupPurchaseListeners,
  getReceiptData,
  type Product,
  type Subscription,
  PRODUCT_IDS,
} from '../lib/storeKit';

// Storage key
const SUBSCRIPTION_STORAGE_KEY = 'lockin-subscription-state';

// Error messages for user display
const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.UserCancelled]: 'Purchase was cancelled',
  [ErrorCode.ItemUnavailable]: 'Product not available for purchase',
  [ErrorCode.NetworkError]: 'Network error. Please check your connection.',
  [ErrorCode.ServiceError]: 'There was a problem with the App Store. Please try again.',
  [ErrorCode.ReceiptFailed]: 'Failed to validate purchase. Please try again.',
  [ErrorCode.AlreadyOwned]: 'You already own this subscription.',
};

interface SubscriptionState {
  // Subscription status
  isSubscribed: boolean;
  currentSubscription: Subscription | null;

  // Products from App Store
  products: Product[];

  // Loading states
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Error state
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      currentSubscription: null,
      products: [],
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      error: null,

      // Initialize IAP and set up listeners
      initialize: async () => {
        try {
          console.log('[Subscription] Initializing...');

          // Initialize IAP connection
          const initialized = await initializeIAP();
          if (!initialized) {
            console.error('[Subscription] Failed to initialize IAP');
            return;
          }

          // Set up purchase listeners
          setupPurchaseListeners(
            async (purchase: Purchase) => {
              console.log('[Subscription] Processing purchase:', purchase.productId);
              await processPurchase(purchase, set, get);
            },
            (error: PurchaseError) => {
              console.error('[Subscription] Purchase listener error:', error);
              const errorMessage = getErrorMessage(error);
              set({ error: errorMessage, isPurchasing: false });
            }
          );

          // Check existing subscription status from database
          const subscription = await checkSubscriptionStatus();
          if (subscription) {
            set({
              currentSubscription: subscription,
              isSubscribed: subscription.isActive,
            });
            console.log('[Subscription] Found existing subscription, active:', subscription.isActive);
          }

          console.log('[Subscription] Initialized');
        } catch (error) {
          console.error('[Subscription] Error initializing:', error);
        }
      },

      // Fetch available products from App Store
      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const products = await getProducts();
          set({ products, isLoading: false });
          console.log('[Subscription] Products fetched:', products.map(p => p.productId));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error('[Subscription] Error fetching products:', error);
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Purchase a product
      purchaseProduct: async (productId: string): Promise<boolean> => {
        set({ isPurchasing: true, error: null });
        try {
          await purchaseProduct(productId);
          // The actual result comes through the purchase listener
          // isPurchasing will be set to false when the listener processes the purchase
          return true;
        } catch (error) {
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
          const purchases = await restorePurchases();

          if (purchases.length === 0) {
            console.log('[Subscription] No purchases to restore');
            set({ isRestoring: false });
            return false;
          }

          // Get the receipt and validate it
          const receiptData = await getReceiptData();
          if (receiptData) {
            const subscription = await validateReceipt(receiptData);
            if (subscription?.isActive) {
              set({
                currentSubscription: subscription,
                isSubscribed: true,
                isRestoring: false,
              });
              console.log('[Subscription] Restore complete, subscribed:', true);
              return true;
            }
          }

          set({ isRestoring: false });
          console.log('[Subscription] Restore complete, no active subscription');
          return false;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error('[Subscription] Restore error:', error);
          set({ error: errorMessage, isRestoring: false });
          return false;
        }
      },

      // Check current subscription status from database
      checkSubscriptionStatus: async (): Promise<boolean> => {
        try {
          const subscription = await checkSubscriptionStatus();

          if (subscription) {
            set({
              currentSubscription: subscription,
              isSubscribed: subscription.isActive,
            });
            console.log('[Subscription] Status checked, subscribed:', subscription.isActive);
            return subscription.isActive;
          }

          set({ isSubscribed: false, currentSubscription: null });
          return false;
        } catch (error) {
          console.error('[Subscription] Error checking status:', error);
          return get().isSubscribed; // Return cached value on error
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store (for logout)
      reset: () => {
        cleanupPurchaseListeners();
        set({
          isSubscribed: false,
          currentSubscription: null,
          products: [],
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

// Process a purchase from the listener
async function processPurchase(
  purchase: Purchase,
  set: (state: Partial<SubscriptionState>) => void,
  _get: () => SubscriptionState
): Promise<void> {
  try {
    // Get the receipt data
    const receiptData = await getReceiptData();
    if (!receiptData) {
      console.error('[Subscription] No receipt data');
      set({ isPurchasing: false, error: 'No receipt data received' });
      return;
    }

    // Validate receipt with server
    const subscription = await validateReceipt(receiptData);

    if (subscription?.isActive) {
      set({
        currentSubscription: subscription,
        isSubscribed: true,
        isPurchasing: false,
      });
      console.log('[Subscription] Purchase validated, subscribed:', true);
    } else {
      set({
        isPurchasing: false,
        error: 'Subscription validation failed',
      });
    }

    // Finish the transaction
    await finishPurchaseTransaction(purchase);
  } catch (error) {
    console.error('[Subscription] Error processing purchase:', error);
    set({ isPurchasing: false, error: 'Failed to process purchase' });
  }
}

// Helper to get user-friendly error message
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const purchaseError = error as PurchaseError;
    if (purchaseError.code && ERROR_MESSAGES[purchaseError.code]) {
      return ERROR_MESSAGES[purchaseError.code];
    }
    if (purchaseError.message) {
      return purchaseError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Selector hooks for common use cases
export const useIsSubscribed = () => useSubscriptionStore((state) => state.isSubscribed);
export const useSubscriptionLoading = () =>
  useSubscriptionStore((state) => state.isLoading || state.isPurchasing || state.isRestoring);

// Export product IDs for use in components
export { PRODUCT_IDS };
