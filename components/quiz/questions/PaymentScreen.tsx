import { Ionicons } from '@expo/vector-icons';
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

import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { useSubscriptionStore, useIsSubscribed } from '../../../store/useSubscriptionStore';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PaymentScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * PaymentScreen - Quiz funnel payment screen using RevenueCat Paywall
 *
 * This component is part of the onboarding quiz funnel. It presents
 * the RevenueCat paywall modal automatically when shown.
 */
export default function PaymentScreen({ onContinue, onBack }: PaymentScreenProps) {
  const insets = useSafeAreaInsets();
  const isSubscribed = useIsSubscribed();
  const { presentPaywall, isPurchasing, error, clearError } = useSubscriptionStore();
  const hasShownPaywall = useRef(false);

  // If already subscribed, continue immediately
  useEffect(() => {
    if (isSubscribed) {
      onContinue();
    }
  }, [isSubscribed, onContinue]);

  // Present paywall on mount (only once)
  useEffect(() => {
    if (hasShownPaywall.current) return;

    const showPaywall = async () => {
      hasShownPaywall.current = true;
      const success = await presentPaywall();

      if (success) {
        // Purchase or restore successful - continue to next screen
        onContinue();
      }
      // If cancelled, user stays on this screen and can retry or go back
    };

    // Small delay to ensure screen is mounted
    const timer = setTimeout(showPaywall, 300);
    return () => clearTimeout(timer);
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  // Handle retry - show paywall again
  const handleRetry = async () => {
    const success = await presentPaywall();
    if (success) {
      onContinue();
    }
  };

  return (
    <ImageBackground source={nightSkyBackground} style={styles.container} resizeMode="cover">
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Custom header - back button only */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isPurchasing}
          >
            <Ionicons name="chevron-back" size={28} color={BrandColors.text.primary} />
          </Pressable>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {isPurchasing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.primary.main} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.messageContainer}>
              <Text style={styles.title}>Unlock LockIn Pro</Text>
              <Text style={styles.subtitle}>
                Take control of your screen time and build lasting habits
              </Text>

              {/* Retry Button */}
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={styles.retryButtonText}>View Plans</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 40 }} />
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  retryButton: {
    backgroundColor: BrandColors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});
