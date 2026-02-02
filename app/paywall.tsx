import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../components/Button3D';
import CloudBackground from '../components/quiz/CloudBackground';
import { BrandColors } from '../constants/BrandColors';
import { Fonts } from '../constants/Fonts';
import { useSubscriptionStore, PRODUCT_IDS } from '../store/useSubscriptionStore';

// Assets
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Benefits list
const BENEFITS = [
  'Unlimited app blocking',
  'Detailed usage analytics',
  'Custom blocking schedules',
  'Priority support',
];

// Plan type
type PlanType = 'monthly' | 'yearly';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

  const {
    products,
    isLoading,
    isPurchasing,
    isRestoring,
    isSubscribed,
    error,
    fetchProducts,
    purchaseProduct,
    restorePurchases,
    clearError,
  } = useSubscriptionStore();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // If already subscribed, go back
  useEffect(() => {
    if (isSubscribed) {
      router.back();
    }
  }, [isSubscribed]);

  // Get products from store
  const monthlyProduct = products.find(
    (product) => product.productId === PRODUCT_IDS.monthly
  );
  const yearlyProduct = products.find(
    (product) => product.productId === PRODUCT_IDS.yearly
  );

  // Calculate savings for yearly plan
  const calculateSavings = () => {
    if (!monthlyProduct || !yearlyProduct) return null;
    const yearlyMonthlyEquivalent = yearlyProduct.price / 12;
    const savings = Math.round((1 - yearlyMonthlyEquivalent / monthlyProduct.price) * 100);
    return savings > 0 ? savings : null;
  };

  const savings = calculateSavings();

  // Handle subscription purchase
  const handleSubscribe = async () => {
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.monthly : PRODUCT_IDS.yearly;
    await purchaseProduct(productId);
    // The purchase listener will handle updating the state and triggering navigation
  };

  // Handle restore purchases
  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Success', 'Your subscription has been restored!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('No Subscription Found', 'We couldn\'t find any previous purchases to restore.');
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    router.back();
  };

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  // Format monthly equivalent for yearly
  const formatMonthlyEquivalent = (price: number, currency: string) => {
    const monthlyPrice = price / 12;
    const formatted = monthlyPrice.toFixed(2);
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${formatted}/mo`;
  };

  const isProcessing = isPurchasing || isRestoring;

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
        {/* Custom header - close button */}
        <View style={styles.header}>
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isProcessing}
          >
            <Ionicons
              name="close"
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
                    {monthlyProduct?.localizedPrice ?? '---'}
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
                    {yearlyProduct?.localizedPrice ?? '---'}
                  </Text>
                  <Text style={styles.planPeriod}>per year</Text>
                  {yearlyProduct && (
                    <Text style={styles.monthlyEquivalent}>
                      {formatMonthlyEquivalent(yearlyProduct.price, yearlyProduct.currency)}
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
            title={isPurchasing ? 'Processing...' : 'Subscribe Now'}
            onPress={handleSubscribe}
            disabled={isProcessing || isLoading}
            loading={isPurchasing}
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
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButtonPressed: {
    opacity: 0.6,
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
