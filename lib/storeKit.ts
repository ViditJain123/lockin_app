import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getReceiptIOS,
  syncIOS,
  type Purchase,
  type PurchaseError,
  type ProductOrSubscription,
  ErrorCode,
} from 'react-native-iap';
import { Platform } from 'react-native';

import { supabase } from './supabase';

// Product identifiers (from App Store Connect)
export const PRODUCT_IDS = {
  monthly: 'monthly01',
  yearly: 'yearly01',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Product info returned from App Store
export interface Product {
  productId: string;
  title: string;
  description: string;
  price: number;
  localizedPrice: string;
  currency: string;
}

// Subscription info from our database
export interface Subscription {
  productId: string;
  isActive: boolean;
  expiresDate: string | null;
  autoRenewStatus: boolean;
  environment: string;
}

// Track initialization state
let isInitialized = false;
let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;

// Callback for purchase updates
let onPurchaseUpdate: ((purchase: Purchase) => Promise<void>) | null = null;

/**
 * Initialize IAP connection to App Store
 */
export async function initializeIAP(): Promise<boolean> {
  if (isInitialized) {
    console.log('[StoreKit] Already initialized');
    return true;
  }

  try {
    const result = await initConnection();
    console.log('[StoreKit] Connection initialized:', result);
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[StoreKit] Failed to initialize:', error);
    return false;
  }
}

/**
 * Set up purchase listeners
 * Should be called after initialization to handle purchase updates
 */
export function setupPurchaseListeners(
  onUpdate: (purchase: Purchase) => Promise<void>,
  onError: (error: PurchaseError) => void
): void {
  // Remove existing listeners if any
  cleanupPurchaseListeners();

  onPurchaseUpdate = onUpdate;

  // Listen for purchase updates
  purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
    console.log('[StoreKit] Purchase updated:', purchase.productId);
    if (onPurchaseUpdate) {
      await onPurchaseUpdate(purchase);
    }
  });

  // Listen for purchase errors
  purchaseErrorSubscription = purchaseErrorListener((error) => {
    console.error('[StoreKit] Purchase error:', error);
    onError(error);
  });

  console.log('[StoreKit] Purchase listeners set up');
}

/**
 * Clean up purchase listeners
 */
export function cleanupPurchaseListeners(): void {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  onPurchaseUpdate = null;
}

/**
 * Get available products from App Store
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const productIds = Object.values(PRODUCT_IDS);
    const result = await fetchProducts({
      skus: productIds,
      type: 'subs',
    });

    if (!result) {
      console.log('[StoreKit] No products returned');
      return [];
    }

    console.log('[StoreKit] Products fetched:', result.length);

    return result.map((product: ProductOrSubscription) => ({
      productId: product.id,
      title: product.title || product.id,
      description: product.description || '',
      price: product.price || 0,
      localizedPrice: product.displayPrice || '---',
      currency: product.currency || 'USD',
    }));
  } catch (error) {
    console.error('[StoreKit] Error fetching products:', error);
    throw error;
  }
}

/**
 * Initiate a purchase
 * Returns the purchase object if successful, null if cancelled
 */
export async function purchaseProduct(productId: string): Promise<Purchase | null> {
  try {
    console.log('[StoreKit] Requesting purchase for:', productId);

    // Request the purchase - this will trigger the purchaseUpdatedListener
    if (Platform.OS === 'ios') {
      await requestPurchase({
        request: {
          apple: { sku: productId },
        },
        type: 'subs',
      });
    }

    // The actual purchase result comes through the listener
    // Return null here as the listener handles the rest
    return null;
  } catch (error) {
    const purchaseError = error as PurchaseError;

    // User cancelled is not an error
    if (purchaseError.code === ErrorCode.UserCancelled) {
      console.log('[StoreKit] User cancelled purchase');
      return null;
    }

    console.error('[StoreKit] Purchase error:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<Purchase[]> {
  try {
    console.log('[StoreKit] Restoring purchases...');

    // Sync with App Store first (iOS)
    if (Platform.OS === 'ios') {
      await syncIOS();
    }

    // Get available purchases
    const purchases = await getAvailablePurchases({
      alsoPublishToEventListenerIOS: false,
      onlyIncludeActiveItemsIOS: true,
    });

    console.log('[StoreKit] Restored purchases:', purchases?.length || 0);
    return purchases || [];
  } catch (error) {
    console.error('[StoreKit] Error restoring purchases:', error);
    throw error;
  }
}

/**
 * Validate receipt with our server
 */
export async function validateReceipt(receiptData: string): Promise<Subscription | null> {
  try {
    console.log('[StoreKit] Validating receipt with server...');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[StoreKit] No session found for receipt validation');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('validate-receipt', {
      body: { receiptData },
    });

    if (error) {
      console.error('[StoreKit] Receipt validation error:', error);
      return null;
    }

    if (!data.success) {
      console.error('[StoreKit] Receipt validation failed:', data.error);
      return null;
    }

    console.log('[StoreKit] Receipt validated successfully');
    return data.subscription;
  } catch (error) {
    console.error('[StoreKit] Error validating receipt:', error);
    return null;
  }
}

/**
 * Finish a transaction after processing
 * This is required to tell the App Store we've handled the purchase
 */
export async function finishPurchaseTransaction(purchase: Purchase): Promise<void> {
  try {
    await finishTransaction({ purchase, isConsumable: false });
    console.log('[StoreKit] Transaction finished:', purchase.transactionId);
  } catch (error) {
    console.error('[StoreKit] Error finishing transaction:', error);
    throw error;
  }
}

/**
 * Check subscription status from our database
 */
export async function checkSubscriptionStatus(): Promise<Subscription | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[StoreKit] No session, cannot check subscription');
      return null;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('expires_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null;
      }
      console.error('[StoreKit] Error checking subscription:', error);
      return null;
    }

    // Check if subscription is still active
    const isActive = data.expires_date
      ? new Date(data.expires_date) > new Date()
      : false;

    return {
      productId: data.product_id,
      isActive,
      expiresDate: data.expires_date,
      autoRenewStatus: data.auto_renew_status,
      environment: data.environment,
    };
  } catch (error) {
    console.error('[StoreKit] Error checking subscription:', error);
    return null;
  }
}

/**
 * End IAP connection (cleanup)
 */
export async function cleanupIAP(): Promise<void> {
  cleanupPurchaseListeners();

  if (isInitialized) {
    try {
      await endConnection();
      isInitialized = false;
      console.log('[StoreKit] Connection ended');
    } catch (error) {
      console.error('[StoreKit] Error ending connection:', error);
    }
  }
}

/**
 * Get receipt data (iOS only)
 */
export async function getReceiptData(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    console.warn('[StoreKit] Receipt data only available on iOS');
    return null;
  }

  try {
    const receipt = await getReceiptIOS();
    return receipt || null;
  } catch (error) {
    console.error('[StoreKit] Error getting receipt:', error);
    return null;
  }
}
