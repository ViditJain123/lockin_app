import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '@/components/Button3D';
import { Fonts } from '@/constants/Fonts';
import { unblockAppsForEmergency, isBlockingAvailable } from '@/lib/blockingService';
import {
  purchaseConsumable,
  getEmergencyBreakPrice,
  getErrorMessage,
  EMERGENCY_BREAK_PRODUCT_ID,
} from '@/lib/revenueCat';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import {
  useEmergencyAccessStore,
  FREE_PASS_DURATION_MINUTES,
  PAID_PASS_DURATION_MINUTES,
  MAX_PAID_PURCHASES_PER_DAY,
} from '@/store/useEmergencyAccessStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function EmergencyAccessScreen() {
  const insets = useSafeAreaInsets();
  const familyActivitySelection = useOnboardingStore((s) => s.quizAnswers.familyActivitySelection);

  // Emergency access store
  const freePassUsedToday = useEmergencyAccessStore((s) => s.freePassUsedToday);
  const paidPurchasesToday = useEmergencyAccessStore((s) => s.paidPurchasesToday);
  const activeSession = useEmergencyAccessStore((s) => s.activeSession);
  const consumeFreePass = useEmergencyAccessStore((s) => s.consumeFreePass);
  const consumePaidPass = useEmergencyAccessStore((s) => s.consumePaidPass);

  // Countdown state for active sessions
  const [countdown, setCountdown] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Purchase state
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [priceString, setPriceString] = useState<string | null>(null);

  const purchasesRemaining = MAX_PAID_PURCHASES_PER_DAY - paidPurchasesToday;

  // Fetch price on mount
  useEffect(() => {
    getEmergencyBreakPrice().then((price) => {
      setPriceString(price);
    });
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (activeSession) {
      const updateCountdown = () => {
        const remaining = new Date(activeSession.expiresAt).getTime() - Date.now();
        setCountdown(Math.max(0, remaining));
        if (remaining <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
      updateCountdown();
      intervalRef.current = setInterval(updateCountdown, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [activeSession?.expiresAt]);

  const handleUseFreePass = () => {
    const success = consumeFreePass();
    if (success && isBlockingAvailable() && familyActivitySelection) {
      unblockAppsForEmergency(familyActivitySelection, FREE_PASS_DURATION_MINUTES);
    }
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await purchaseConsumable(EMERGENCY_BREAK_PRODUCT_ID);

      if (result === null) {
        // User cancelled
        return;
      }

      // Purchase succeeded — consume the paid pass
      consumePaidPass();
      if (isBlockingAvailable() && familyActivitySelection) {
        unblockAppsForEmergency(familyActivitySelection, PAID_PASS_DURATION_MINUTES);
      }
    } catch (error: any) {
      setPurchaseError(getErrorMessage(error));
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const displayPrice = priceString || '$0.99';

  // Determine which state to show
  const renderContent = () => {
    // State 1: Active session with countdown
    if (activeSession && countdown > 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownText}>{formatCountdown(countdown)}</Text>
          </View>
          <Text style={styles.stateTitle}>Break Active</Text>
          <Text style={styles.stateSubtitle}>
            Your apps are temporarily unlocked
          </Text>
          <View style={styles.ctaContainer}>
            <Button3D title="Close" onPress={handleClose} />
          </View>
        </Animated.View>
      );
    }

    // State 2: Free pass available
    if (!freePassUsedToday) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Emergency Pass</Text>
          <Text style={styles.stateSubtitle}>
            {FREE_PASS_DURATION_MINUTES} minutes of free screen time
          </Text>

          <View style={styles.infoCard}>
            <Ionicons name="gift-outline" size={24} color="#34C759" style={{ marginBottom: 8 }} />
            <Text style={styles.infoCardText}>1 free pass per day</Text>
          </View>

          <View style={styles.ctaContainer}>
            <Button3D title="Use Emergency Pass" onPress={handleUseFreePass} />
          </View>
        </Animated.View>
      );
    }

    // State 3: Paid purchase available
    if (paidPurchasesToday < MAX_PAID_PURCHASES_PER_DAY) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Need More Time?</Text>
          <Text style={styles.stateSubtitle}>
            Your free pass has been used today
          </Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceCardTitle}>
              {PAID_PASS_DURATION_MINUTES} minutes of screen time
            </Text>
            <Text style={styles.priceCardPrice}>{displayPrice}</Text>
            <Text style={styles.priceCardRemaining}>
              {purchasesRemaining} {purchasesRemaining === 1 ? 'purchase' : 'purchases'} left today
            </Text>
          </View>

          {purchaseError && (
            <Text style={styles.errorText}>{purchaseError}</Text>
          )}

          <View style={styles.ctaContainer}>
            {isPurchasing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <Button3D
                title={`Buy ${PAID_PASS_DURATION_MINUTES} Minutes \u2014 ${displayPrice}`}
                onPress={handlePurchase}
              />
            )}
          </View>
        </Animated.View>
      );
    }

    // State 4: Daily max reached
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.stateContainer}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={48} color="rgba(255, 255, 255, 0.4)" />
        </View>
        <Text style={styles.stateTitle}>Daily Limit Reached</Text>
        <Text style={styles.stateSubtitle}>
          You've used all your emergency passes for today.{'\n'}Come back tomorrow!
        </Text>
        <View style={styles.ctaContainer}>
          <Button3D title="Close" onPress={handleClose} />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/night-sky-background.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Need a Break?</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          {/* Main content */}
          <View style={styles.mainContent}>
            {renderContent()}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateContainer: {
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  // Countdown
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#FF3B5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 40,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  // Info card (free pass)
  infoCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Price card (paid)
  priceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 92, 0.3)',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceCardTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceCardPrice: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#FF3B5C',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceCardRemaining: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  // Lock icon (daily max)
  lockIcon: {
    marginBottom: 16,
  },
  // Error
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#FF3B5C',
    textAlign: 'center',
    marginBottom: 8,
  },
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // CTA
  ctaContainer: {
    width: '100%',
    marginTop: 24,
  },
});
