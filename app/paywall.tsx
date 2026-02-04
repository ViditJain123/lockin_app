import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '../constants/BrandColors';
import { useSubscriptionStore, useIsSubscribed } from '../store/useSubscriptionStore';

/**
 * PaywallScreen - Presents the RevenueCat Paywall
 *
 * This screen automatically presents the RevenueCat paywall modal
 * when navigated to. It handles:
 * - Presenting the paywall
 * - Processing purchases
 * - Restoring purchases
 * - Navigating back on completion or cancellation
 */
export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const isSubscribed = useIsSubscribed();
  const { presentPaywall, error, clearError } = useSubscriptionStore();

  // If already subscribed, go back immediately
  useEffect(() => {
    if (isSubscribed) {
      router.back();
    }
  }, [isSubscribed]);

  // Present paywall on mount
  useEffect(() => {
    const showPaywall = async () => {
      const success = await presentPaywall();

      if (success) {
        // Purchase or restore successful - go back
        router.back();
      } else {
        // User cancelled or error - go back
        router.back();
      }
    };

    // Small delay to ensure screen is mounted
    const timer = setTimeout(showPaywall, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => {
            clearError();
            router.back();
          },
        },
      ]);
    }
  }, [error]);

  // Show loading indicator while paywall is being presented
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={BrandColors.primary.main} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
