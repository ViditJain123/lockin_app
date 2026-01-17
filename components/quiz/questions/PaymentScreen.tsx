import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { useSubscriptionStore } from '../../../store/useSubscriptionStore';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PaymentScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

// Benefits list
const BENEFITS = [
  'Unlimited app blocking',
  'Detailed usage analytics',
  'Custom blocking schedules',
  'Priority support',
];

// Plan type
type PlanType = 'monthly' | 'yearly';

export default function PaymentScreen({
  onContinue,
  onBack,
}: PaymentScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [isPresentingPaywall, setIsPresentingPaywall] = useState(false);

  const {
    offerings,
    isLoading,
    isPurchasing,
    isRestoring,
    isSubscribed,
    error,
    fetchOfferings,
    purchasePackage,
    restorePurchases,
    clearError,
  } = useSubscriptionStore();

  // Fetch offerings on mount
  useEffect(() => {
    fetchOfferings();
  }, []);

  // If already subscribed, continue
  useEffect(() => {
    if (isSubscribed) {
      onContinue();
    }
  }, [isSubscribed]);

  // Get packages from offerings
  const monthlyPackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
  );
  const yearlyPackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_annual' || pkg.packageType === 'ANNUAL'
  );

  // Calculate savings for yearly plan
  const calculateSavings = () => {
    if (!monthlyPackage || !yearlyPackage) return null;
    const monthlyPrice = monthlyPackage.product.price;
    const yearlyPrice = yearlyPackage.product.price;
    const yearlyMonthlyEquivalent = yearlyPrice / 12;
    const savings = Math.round((1 - yearlyMonthlyEquivalent / monthlyPrice) * 100);
    return savings > 0 ? savings : null;
  };

  const savings = calculateSavings();

  // Present RevenueCat native paywall
  const presentRevenueCatPaywall = async () => {
    setIsPresentingPaywall(true);
    try {
      const paywallResult = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('[Paywall] Purchase/restore successful');
          onContinue();
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('[Paywall] Not presented - user may already be subscribed');
          // Check if already subscribed
          const { checkSubscriptionStatus } = useSubscriptionStore.getState();
          const subscribed = await checkSubscriptionStatus();
          if (subscribed) {
            onContinue();
          }
          break;
        case PAYWALL_RESULT.ERROR:
          console.error('[Paywall] Error presenting paywall');
          Alert.alert('Error', 'There was a problem loading the subscription options. Please try again.');
          break;
        case PAYWALL_RESULT.CANCELLED:
          console.log('[Paywall] User cancelled');
          break;
      }
    } catch (error) {
      console.error('[Paywall] Error:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setIsPresentingPaywall(false);
    }
  };

  // Handle subscription purchase (fallback to custom UI)
  const handleSubscribe = async () => {
    // Try to present native RevenueCat paywall first
    await presentRevenueCatPaywall();
  };

  // Handle restore purchases
  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Success', 'Your subscription has been restored!', [
        { text: 'OK', onPress: onContinue },
      ]);
    } else {
      Alert.alert('No Subscription Found', 'We couldn\'t find any previous purchases to restore.');
    }
  };

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  // Format monthly equivalent for yearly
  const formatMonthlyEquivalent = (pkg: PurchasesPackage | undefined) => {
    if (!pkg) return '';
    const monthlyPrice = pkg.product.price / 12;
    const currencyCode = pkg.product.currencyCode;
    const formatted = monthlyPrice.toFixed(2);
    const symbol = currencyCode === 'USD' ? '$' : currencyCode;
    return `${symbol}${formatted}/mo`;
  };

  const isProcessing = isPurchasing || isRestoring || isPresentingPaywall;

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Custom header - back button only */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isProcessing}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={BrandColors.text.primary}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Crown Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[BrandColors.primary.gradientStart, BrandColors.primary.gradientEnd]}
              style={styles.iconGradient}
            >
              <Text style={styles.crownEmoji}>👑</Text>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Unlock LockIn Pro</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Take control of your screen time and build lasting habits
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.checkIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={BrandColors.primary.main}
                  />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.primary.main} />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <>
              {/* Subscription Cards */}
              <View style={styles.cardsContainer}>
                {/* Monthly Card */}
                <Pressable
                  style={[
                    styles.planCard,
                    selectedPlan === 'monthly' && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  disabled={isProcessing}
                >
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>
                    {monthlyPackage?.product.priceString ?? '---'}
                  </Text>
                  <Text style={styles.planPeriod}>per month</Text>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary.main} />
                    </View>
                  )}
                </Pressable>

                {/* Yearly Card */}
                <Pressable
                  style={[
                    styles.planCard,
                    selectedPlan === 'yearly' && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('yearly')}
                  disabled={isProcessing}
                >
                  {/* Best Value Badge */}
                  {savings && (
                    <View style={styles.badgeContainer}>
                      <LinearGradient
                        colors={[BrandColors.primary.gradientStart, BrandColors.primary.gradientEnd]}
                        style={styles.badge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.badgeText}>SAVE {savings}%</Text>
                      </LinearGradient>
                    </View>
                  )}
                  <Text style={[styles.planName, { marginTop: savings ? 8 : 0 }]}>Yearly</Text>
                  <Text style={styles.planPrice}>
                    {yearlyPackage?.product.priceString ?? '---'}
                  </Text>
                  <Text style={styles.planPeriod}>per year</Text>
                  {yearlyPackage && (
                    <Text style={styles.monthlyEquivalent}>
                      {formatMonthlyEquivalent(yearlyPackage)}
                    </Text>
                  )}
                  {selectedPlan === 'yearly' && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary.main} />
                    </View>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Section - Fixed */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          {/* Subscribe Button */}
          <Button3D
            title={isPresentingPaywall ? 'Loading...' : 'Continue'}
            onPress={handleSubscribe}
            disabled={isProcessing || isLoading}
            loading={isPresentingPaywall}
          />

          {/* Restore Purchases */}
          <Pressable
            onPress={handleRestore}
            style={styles.restoreButton}
            disabled={isProcessing}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={BrandColors.text.secondary} />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </Pressable>

          {/* Terms and Privacy */}
          <View style={styles.legalContainer}>
            <Pressable onPress={() => Linking.openURL('https://lockin.club/terms')}>
              <Text style={styles.legalText}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>•</Text>
            <Pressable onPress={() => Linking.openURL('https://lockin.club/privacy')}>
              <Text style={styles.legalText}>Privacy Policy</Text>
            </Pressable>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIconContainer: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginTop: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: BrandColors.primary.main,
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
  },
  badgeContainer: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: Fonts.interBold,
    color: BrandColors.text.primary,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
  },
  monthlyEquivalent: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: BrandColors.primary.main,
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: BrandColors.text.secondary,
    textDecorationLine: 'underline',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
  },
  legalSeparator: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    marginHorizontal: 8,
  },
});
