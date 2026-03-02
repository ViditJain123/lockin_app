import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '../constants/Fonts';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAuth } from '../contexts/AuthContext';

/**
 * HardPaywallScreen - Blocks app access when user has no active subscription.
 *
 * Renders RevenueCatUI.Paywall inline as a full-screen view with no close button.
 * Users cannot swipe to dismiss. Only way out is to subscribe or sign out.
 */
export default function HardPaywallScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const handlePurchaseCompleted = async () => {
    // Refresh subscription state after purchase
    const customerInfo = await Purchases.getCustomerInfo();
    const store = useSubscriptionStore.getState();
    store.checkSubscriptionStatus();
  };

  const handleRestoreCompleted = async () => {
    // Refresh subscription state after restore
    await useSubscriptionStore.getState().checkSubscriptionStatus();
  };

  const handlePurchaseError = ({ error }: { error: any }) => {
    if (!error?.userCancelled) {
      Alert.alert('Purchase Error', error?.message || 'An unexpected error occurred');
    }
  };

  const handleRestoreError = ({ error }: { error: any }) => {
    Alert.alert('Restore Error', error?.message || 'Could not restore purchases');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        style={styles.paywall}
        options={{ displayCloseButton: false }}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
        onPurchaseError={handlePurchaseError}
        onRestoreError={handleRestoreError}
        onDismiss={() => {
          // No-op: prevent dismissal
        }}
      />

      {/* Sign Out link at bottom */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [pressed && styles.buttonPressed]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  paywall: {
    flex: 1,
  },
  bottomContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.4)',
    textDecorationLine: 'underline',
  },
});
