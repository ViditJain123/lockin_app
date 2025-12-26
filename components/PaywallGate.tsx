import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlacement } from 'expo-superwall';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const PAYWALL_SHOWN_KEY = '@paywall_shown_after_login';

interface PaywallGateProps {
  children: React.ReactNode;
  userId?: string;
}

/**
 * PaywallGate shows a soft paywall once after login.
 * The paywall is skippable - user can dismiss and continue to the app.
 * Uses the "app_launch" placement which should be configured as Non-Gated in Superwall dashboard.
 */
export function PaywallGate({ children, userId }: PaywallGateProps) {
  const [isReady, setIsReady] = useState(false);
  const hasTriggeredRef = useRef(false);

  const { registerPlacement } = usePlacement({
    onPresent: (paywallInfo) => {
      console.log('[PaywallGate] Paywall presented:', paywallInfo.name);
    },
    onDismiss: (paywallInfo, result) => {
      console.log('[PaywallGate] Paywall dismissed:', result?.type);
      setIsReady(true);
    },
    onSkip: (reason) => {
      console.log('[PaywallGate] Paywall skipped, reason:', JSON.stringify(reason, null, 2));
      setIsReady(true);
    },
    onError: (error) => {
      console.error('[PaywallGate] Paywall error:', error);
      setIsReady(true);
    },
  });

  useEffect(() => {
    const checkAndShowPaywall = async () => {
      console.log('[PaywallGate] Starting paywall check, userId:', userId);

      if (hasTriggeredRef.current) {
        console.log('[PaywallGate] Already triggered this session, skipping');
        setIsReady(true);
        return;
      }
      hasTriggeredRef.current = true;

      try {
        // Check if we've already shown paywall for this session
        const storageKey = userId ? `${PAYWALL_SHOWN_KEY}_${userId}` : PAYWALL_SHOWN_KEY;
        const hasShown = await AsyncStorage.getItem(storageKey);

        console.log('[PaywallGate] Storage key:', storageKey, 'hasShown:', hasShown);

        // TODO: Re-enable this check after testing paywall display
        // if (hasShown === 'true') {
        //   console.log('[PaywallGate] Already shown paywall, letting user through');
        //   setIsReady(true);
        //   return;
        // }

        // Mark as shown before triggering
        await AsyncStorage.setItem(storageKey, 'true');

        console.log('[PaywallGate] Calling registerPlacement for app_launch placement');

        // Add timeout to prevent hanging if Superwall doesn't respond
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('[PaywallGate] Timeout waiting for registerPlacement - letting user through');
            resolve();
          }, 10000); // 10 second timeout for first launch
        });

        const placementPromise = registerPlacement({
          placement: 'app_launch',
          feature: () => {
            console.log('[PaywallGate] Feature callback executed - user granted access');
            setIsReady(true);
          },
        });

        // Race between placement and timeout
        await Promise.race([placementPromise, timeoutPromise]);

        console.log('[PaywallGate] registerPlacement completed or timed out');
        setIsReady(true);
      } catch (error) {
        console.error('[PaywallGate] Error showing paywall:', error);
        setIsReady(true);
      }
    };

    checkAndShowPaywall();
  }, [userId, registerPlacement]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fa576a" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
