import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  type PurchasesStoreProduct,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'appl_UjCZpUjBoKjZaaaLihwedqiSwhU';

// Entitlement identifier (configured in RevenueCat dashboard)
export const ENTITLEMENT_ID = 'Lockin Club Pro';

// Product identifiers (configured in RevenueCat dashboard)
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

// Consumable product ID for emergency break passes
export const EMERGENCY_BREAK_PRODUCT_ID = 'emergency_break_10min';

// Track initialization state
let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called early in app lifecycle (e.g., in root layout)
 */
export async function initializeRevenueCat(): Promise<boolean> {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return true;
  }

  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    isInitialized = true;
    console.log('[RevenueCat] SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Failed to initialize:', error);
    return false;
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

/**
 * Get current customer info
 * Contains entitlements, active subscriptions, and more
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('[RevenueCat] Customer info retrieved');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    return null;
  }
}

/**
 * Check if user has active "Lockin Club Pro" entitlement
 */
export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('[RevenueCat] Entitlement check:', ENTITLEMENT_ID, 'active:', isActive);
    return isActive;
  } catch (error) {
    console.error('[RevenueCat] Error checking entitlement:', error);
    return false;
  }
}

/**
 * Get active entitlement info if available
 */
export async function getActiveEntitlement() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement || null;
  } catch (error) {
    console.error('[RevenueCat] Error getting active entitlement:', error);
    return null;
  }
}

/**
 * Get available offerings (products/packages)
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Offerings retrieved:', offerings.current?.identifier);
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
}

/**
 * Get the current (default) offering
 */
export async function getCurrentOffering() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting current offering:', error);
    return null;
  }
}

/**
 * Purchase a package
 * @param purchasePackage The package to purchase (from offerings)
 */
export async function purchasePackage(
  purchasePackage: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo; productIdentifier: string } | null> {
  try {
    console.log('[RevenueCat] Purchasing package:', purchasePackage.identifier);
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(purchasePackage);
    console.log('[RevenueCat] Purchase successful:', productIdentifier);
    return { customerInfo, productIdentifier };
  } catch (error: any) {
    // Check if user cancelled
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      return null;
    }
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
}

/**
 * Restore purchases
 * Useful for users who reinstall the app or switch devices
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    console.log('[RevenueCat] Restoring purchases...');
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    throw error;
  }
}

/**
 * Set user ID for RevenueCat (optional but recommended)
 * Call this after user authenticates
 * @param userId The user's unique identifier (e.g., from Supabase)
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    console.log('[RevenueCat] Logging in user:', userId);
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error logging in user:', error);
    return null;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  try {
    console.log('[RevenueCat] Logging out user');
    const customerInfo = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error logging out user:', error);
    return null;
  }
}

/**
 * Add listener for customer info updates
 * Useful for real-time subscription status changes
 */
export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  const subscription = Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    subscription.remove();
  };
}

/**
 * Purchase a consumable product (e.g. emergency break pass).
 * Returns the purchased product on success, null if user cancels.
 * Throws on other errors.
 */
export async function purchaseConsumable(
  productId: string
): Promise<PurchasesStoreProduct | null> {
  try {
    console.log('[RevenueCat] Fetching consumable product:', productId);
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );

    if (products.length === 0) {
      throw new Error('Product not found: ' + productId);
    }

    const product = products[0];
    console.log('[RevenueCat] Purchasing consumable:', product.identifier);
    await Purchases.purchaseStoreProduct(product);
    console.log('[RevenueCat] Consumable purchase successful:', product.identifier);
    return product;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled consumable purchase');
      return null;
    }
    console.error('[RevenueCat] Consumable purchase error:', error);
    throw error;
  }
}

/**
 * Get the display price for the emergency break consumable.
 * Returns the localized price string (e.g. "$0.99") or null if unavailable.
 */
export async function getEmergencyBreakPrice(): Promise<string | null> {
  try {
    const products = await Purchases.getProducts(
      [EMERGENCY_BREAK_PRODUCT_ID],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );

    if (products.length === 0) {
      console.log('[RevenueCat] Emergency break product not found');
      return null;
    }

    return products[0].priceString;
  } catch (error) {
    console.error('[RevenueCat] Error fetching emergency break price:', error);
    return null;
  }
}

/**
 * Get subscription management URL (for iOS)
 */
export function getManageSubscriptionsUrl(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  return 'https://play.google.com/store/account/subscriptions';
}

/**
 * Get user-friendly error message from RevenueCat error
 */
export function getErrorMessage(error: any): string {
  if (error?.userCancelled) {
    return 'Purchase was cancelled';
  }

  if (error?.code) {
    switch (error.code) {
      case 1: // PURCHASE_CANCELLED
        return 'Purchase was cancelled';
      case 2: // STORE_PROBLEM
        return 'There was a problem with the App Store. Please try again.';
      case 3: // PURCHASE_NOT_ALLOWED
        return 'Purchases are not allowed on this device';
      case 4: // PURCHASE_INVALID
        return 'The purchase was invalid';
      case 5: // PRODUCT_NOT_AVAILABLE
        return 'This product is not available for purchase';
      case 6: // PRODUCT_ALREADY_PURCHASED
        return 'You already own this subscription';
      case 7: // RECEIPT_ALREADY_IN_USE
        return 'This receipt is already in use by another account';
      case 10: // NETWORK_ERROR
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
