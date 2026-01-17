import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'test_NtbMDJfbOyARzkglQhbWTJWfRJq';

// Product identifiers (from App Store Connect / Google Play)
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

// Entitlement identifier (from RevenueCat dashboard)
export const ENTITLEMENT_ID = 'Lockin';

// Track initialization state
let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts
 */
export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  try {
    // Set log level for debugging (use ERROR in production)
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    throw error;
  }
}

/**
 * Identify a user with RevenueCat (call after authentication)
 * This allows tracking purchases across devices
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User identified:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error identifying user:', error);
    throw error;
  }
}

/**
 * Log out the current user (call when user logs out)
 * Generates a new anonymous user ID
 */
export async function logOutUser(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error logging out:', error);
    throw error;
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    throw error;
  }
}

/**
 * Check if user has active Lockin entitlement
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('[RevenueCat] Subscription status:', isSubscribed);
    return isSubscribed;
  } catch (error) {
    console.error('[RevenueCat] Error checking subscription:', error);
    return false;
  }
}

/**
 * Check entitlement from customer info object
 */
export function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Get the current offering (subscription packages)
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    throw error;
  }
}

/**
 * Get the app user ID
 */
export async function getAppUserId(): Promise<string> {
  return Purchases.getAppUserID();
}

/**
 * Sync purchases with RevenueCat (useful after app reinstall)
 */
export async function syncPurchases(): Promise<void> {
  try {
    await Purchases.syncPurchases();
    console.log('[RevenueCat] Purchases synced');
  } catch (error) {
    console.error('[RevenueCat] Error syncing purchases:', error);
    throw error;
  }
}

/**
 * Set user attributes for analytics
 */
export async function setUserAttributes(attributes: {
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  [key: string]: string | undefined;
}): Promise<void> {
  try {
    if (attributes.email) {
      Purchases.setEmail(attributes.email);
    }
    if (attributes.displayName) {
      Purchases.setDisplayName(attributes.displayName);
    }
    if (attributes.phoneNumber) {
      Purchases.setPhoneNumber(attributes.phoneNumber);
    }

    // Set custom attributes
    for (const [key, value] of Object.entries(attributes)) {
      if (value && !['email', 'displayName', 'phoneNumber'].includes(key)) {
        Purchases.setAttributes({ [key]: value });
      }
    }

    console.log('[RevenueCat] User attributes set');
  } catch (error) {
    console.error('[RevenueCat] Error setting attributes:', error);
  }
}

/**
 * Listen to customer info updates
 */
export function addCustomerInfoListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  const subscription = Purchases.addCustomerInfoUpdateListener(listener);
  return () => subscription.remove();
}
