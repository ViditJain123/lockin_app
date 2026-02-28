import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CloudBackground from './quiz/CloudBackground';

import { BrandColors } from '../constants/BrandColors';
import { Fonts } from '../constants/Fonts';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAuth } from '../contexts/AuthContext';

const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * HardPaywallScreen - Blocks app access when user has no active subscription.
 *
 * Shown after auth when hasCompletedOnboarding is true but isSubscribed is false.
 * Auto-presents RevenueCat paywall on mount. No way to dismiss or bypass.
 */
export default function HardPaywallScreen() {
  const insets = useSafeAreaInsets();
  const { presentPaywall, restorePurchases, isPurchasing, isRestoring, error, clearError } =
    useSubscriptionStore();
  const { signOut } = useAuth();
  const hasShownPaywall = useRef(false);

  // Present paywall on mount (only once)
  useEffect(() => {
    if (hasShownPaywall.current) return;

    const showPaywall = async () => {
      hasShownPaywall.current = true;
      await presentPaywall();
    };

    const timer = setTimeout(showPaywall, 300);
    return () => clearTimeout(timer);
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleViewPlans = async () => {
    await presentPaywall();
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (!restored) {
      Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription for your account.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const isLoading = isPurchasing || isRestoring;

  return (
    <ImageBackground source={nightSkyBackground} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} />
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.mainContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.primary.main} />
              <Text style={styles.loadingText}>
                {isRestoring ? 'Restoring...' : 'Loading...'}
              </Text>
            </View>
          ) : (
            <View style={styles.messageContainer}>
              <Text style={styles.title}>Subscribe to Continue</Text>
              <Text style={styles.subtitle}>
                Your subscription has expired. Renew to keep using LockIn and stay on track.
              </Text>

              <Pressable
                onPress={handleViewPlans}
                style={({ pressed }) => [
                  styles.viewPlansButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.viewPlansButtonText}>View Plans</Text>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                style={({ pressed }) => [
                  styles.restoreButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </Pressable>
            </View>
          )}
        </View>

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginTop: 16,
  },
  messageContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  viewPlansButton: {
    backgroundColor: BrandColors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  viewPlansButtonText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restoreButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: BrandColors.text.secondary,
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.4)',
    textDecorationLine: 'underline',
  },
});
