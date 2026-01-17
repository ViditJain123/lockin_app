import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RevenueCatUI, { CUSTOMER_CENTER_MANAGEMENT_OPTION } from 'react-native-purchases-ui';

import { BrandColors } from '../constants/BrandColors';
import { Fonts } from '../constants/Fonts';
import { useSubscriptionStore, useIsSubscribed } from '../store/useSubscriptionStore';

interface CustomerCenterProps {
  showRestoreOnly?: boolean;
}

/**
 * CustomerCenter - A component for managing subscriptions
 *
 * Features:
 * - Shows subscription status
 * - Opens RevenueCat Customer Center for subscription management
 * - Allows restoring purchases
 *
 * Usage:
 * - Add to Settings or Profile screen
 * - Use showRestoreOnly={true} for minimal restore button only
 */
export default function CustomerCenter({ showRestoreOnly = false }: CustomerCenterProps) {
  const isSubscribed = useIsSubscribed();
  const { customerInfo, restorePurchases, isRestoring } = useSubscriptionStore();
  const [isPresentingCustomerCenter, setIsPresentingCustomerCenter] = useState(false);

  // Get subscription expiration date
  const getExpirationDate = (): string | null => {
    if (!customerInfo?.entitlements.active['Lockin']) return null;
    const expDate = customerInfo.entitlements.active['Lockin'].expirationDate;
    if (!expDate) return null;

    const date = new Date(expDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Present Customer Center
  const presentCustomerCenter = async () => {
    setIsPresentingCustomerCenter(true);
    try {
      const result = await RevenueCatUI.presentCustomerCenter();

      // Handle different management options
      switch (result) {
        case CUSTOMER_CENTER_MANAGEMENT_OPTION.CANCEL:
          console.log('[CustomerCenter] User requested cancellation');
          break;
        case CUSTOMER_CENTER_MANAGEMENT_OPTION.REFUND:
          console.log('[CustomerCenter] User requested refund');
          break;
        case CUSTOMER_CENTER_MANAGEMENT_OPTION.CHANGE_PLANS:
          console.log('[CustomerCenter] User changed plans');
          break;
        default:
          console.log('[CustomerCenter] Customer center closed');
      }
    } catch (error) {
      console.error('[CustomerCenter] Error:', error);
      Alert.alert('Error', 'Could not open subscription management. Please try again.');
    } finally {
      setIsPresentingCustomerCenter(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Success', 'Your subscription has been restored!');
    } else {
      Alert.alert('No Subscription Found', "We couldn't find any previous purchases to restore.");
    }
  };

  // Restore only mode
  if (showRestoreOnly) {
    return (
      <Pressable
        onPress={handleRestore}
        disabled={isRestoring}
        style={({ pressed }) => [
          styles.restoreButton,
          pressed && styles.buttonPressed,
        ]}
      >
        {isRestoring ? (
          <ActivityIndicator size="small" color={BrandColors.primary.main} />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </Pressable>
    );
  }

  const expirationDate = getExpirationDate();

  return (
    <View style={styles.container}>
      {/* Subscription Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={isSubscribed ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isSubscribed ? '#4CAF50' : BrandColors.text.secondary}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {isSubscribed ? 'LockIn Pro Active' : 'Free Plan'}
            </Text>
            {isSubscribed && expirationDate && (
              <Text style={styles.statusSubtitle}>Renews on {expirationDate}</Text>
            )}
            {!isSubscribed && (
              <Text style={styles.statusSubtitle}>Upgrade to unlock all features</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isSubscribed ? (
            <Pressable
              onPress={presentCustomerCenter}
              disabled={isPresentingCustomerCenter}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isPresentingCustomerCenter ? (
                <ActivityIndicator size="small" color={BrandColors.primary.main} />
              ) : (
                <>
                  <Ionicons name="settings-outline" size={20} color={BrandColors.primary.main} />
                  <Text style={styles.actionButtonText}>Manage Subscription</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={BrandColors.primary.main} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color={BrandColors.primary.main} />
                  <Text style={styles.actionButtonText}>Restore Purchases</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Help Text */}
      <Text style={styles.helpText}>
        {isSubscribed
          ? 'Manage your subscription, change plans, or request a refund through the Customer Center.'
          : 'Already subscribed? Restore your purchases to unlock LockIn Pro.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: BrandColors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: BrandColors.primary.main,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: BrandColors.primary.main,
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
});
