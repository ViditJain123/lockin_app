import React, { useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';

import { useSubscriptionStore, useIsSubscribed } from '../../../store/useSubscriptionStore';

interface PaymentScreenProps {
  onContinue: () => void;
}

/**
 * PaymentScreen - Quiz funnel payment screen using RevenueCat Paywall
 *
 * Renders RevenueCatUI.Paywall inline as a full-screen view.
 * Part of the onboarding quiz funnel.
 */
export default function PaymentScreen({ onContinue }: PaymentScreenProps) {
  const isSubscribed = useIsSubscribed();

  // If already subscribed, continue immediately
  useEffect(() => {
    if (isSubscribed) {
      onContinue();
    }
  }, [isSubscribed, onContinue]);

  const handlePurchaseCompleted = async () => {
    await useSubscriptionStore.getState().checkSubscriptionStatus();
    onContinue();
  };

  const handleRestoreCompleted = async () => {
    const isActive = await useSubscriptionStore.getState().checkSubscriptionStatus();
    if (isActive) {
      onContinue();
    }
  };

  const handlePurchaseError = ({ error }: { error: any }) => {
    if (!error?.userCancelled) {
      Alert.alert('Purchase Error', error?.message || 'An unexpected error occurred');
    }
  };

  const handleRestoreError = ({ error }: { error: any }) => {
    Alert.alert('Restore Error', error?.message || 'Could not restore purchases');
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
          // No-op during onboarding: user must subscribe
        }}
      />
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
});
