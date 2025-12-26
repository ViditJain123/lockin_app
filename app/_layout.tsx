import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SuperwallError, SuperwallLoaded, SuperwallLoading, SuperwallProvider } from 'expo-superwall';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import AuthScreen from '../components/AuthScreen';
import { PaywallGate } from '../components/PaywallGate';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Configure splash screen
SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Debug: Log Superwall API key status
  console.log('[Superwall] API Key present:', !!process.env.EXPO_PUBLIC_SUPERWALL_API_KEY);
  console.log('[Superwall] API Key:', process.env.EXPO_PUBLIC_SUPERWALL_API_KEY?.substring(0, 10) + '...');

  return (
    <SuperwallProvider
      apiKeys={{ ios: process.env.EXPO_PUBLIC_SUPERWALL_API_KEY! }}
      onConfigurationError={(error) => {
        console.error('[Superwall] Configuration error:', error);
      }}
    >
      {/* These must be direct children of SuperwallProvider */}
      <SuperwallLoading>
        <View style={superwallStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#fa576a" />
          <Text style={superwallStyles.loadingText}>Loading Superwall...</Text>
        </View>
      </SuperwallLoading>
      <SuperwallError>
        {(error) => (
          <View style={superwallStyles.loadingContainer}>
            <Text style={superwallStyles.errorText}>Superwall Error: {error}</Text>
          </View>
        )}
      </SuperwallError>
      <SuperwallLoaded>
        <AuthProvider>
          <SubscriptionProvider>
            <RootLayoutNav />
          </SubscriptionProvider>
        </AuthProvider>
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}

const superwallStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme() || 'light';
  const { session, isLoading, user } = useAuth();

  // Keep the root view background color in sync with the current theme
  useEffect(() => {
    setBackgroundColorAsync(
      colorScheme === 'dark' ? '#000000' : '#ffffff'
    );
  }, [colorScheme]);

  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff';

  // Show loading indicator while checking session
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="#fa576a" />
      </View>
    );
  }

  // Show auth screen if not authenticated
  if (!session) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <AuthScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <PaywallGate userId={user?.id}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="preview"
              options={{
                presentation: 'fullScreenModal',
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="modal"
              options={{
                presentation: Platform.OS === 'ios'
                  ? isLiquidGlassAvailable()
                    ? 'formSheet'
                    : 'modal'
                  : 'modal',
                headerTransparent: Platform.OS === 'ios',
                headerStyle: {
                  backgroundColor: Platform.OS === 'ios' ? 'transparent' : backgroundColor,
                },
                headerBlurEffect: isLiquidGlassAvailable()
                  ? undefined
                  : colorScheme === 'dark'
                    ? 'dark'
                    : 'light',
                sheetGrabberVisible: true,
                sheetAllowedDetents: [0.8],
                sheetInitialDetentIndex: 0,
                contentStyle: {
                  backgroundColor: isLiquidGlassAvailable() ? 'transparent' : backgroundColor,
                },
              }}
            />
          </Stack>
        </PaywallGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
