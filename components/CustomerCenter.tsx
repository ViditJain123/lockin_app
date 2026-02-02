import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
 * - Links to App Store subscription management
 * - Allows restoring purchases
 *
 * Usage:
 * - Add to Settings or Profile screen
 * - Use showRestoreOnly={true} for minimal restore button only
 */
export default function CustomerCenter({ showRestoreOnly = false }: CustomerCenterProps) {
  const isSubscribed = useIsSubscribed();
  const { currentSubscription, restorePurchases, isRestoring } = useSubscriptionStore();

  // Get subscription expiration date
  const getExpirationDate = (): string | null => {
    if (!currentSubscription?.expiresDate) return null;

    const date = new Date(currentSubscription.expiresDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get product display name
  const getProductDisplayName = (): string => {
    if (!currentSubscription?.productId) return 'LockIn Pro';

    switch (currentSubscription.productId) {
      case 'monthly01':
        return 'LockIn Pro Monthly';
      case 'yearly01':
        return 'LockIn Pro Yearly';
      default:
        return 'LockIn Pro';
    }
  };

  // Open App Store subscription management
  const openSubscriptionManagement = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
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
              {isSubscribed ? getProductDisplayName() : 'Free Plan'}
            </Text>
            {isSubscribed && expirationDate && (
              <Text style={styles.statusSubtitle}>
                {currentSubscription?.autoRenewStatus
                  ? `Renews on ${expirationDate}`
                  : `Expires on ${expirationDate}`
                }
              </Text>
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
              onPress={openSubscriptionManagement}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="settings-outline" size={20} color={BrandColors.primary.main} />
              <Text style={styles.actionButtonText}>Manage Subscription</Text>
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
          ? 'Manage your subscription, change plans, or cancel through the App Store.'
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
