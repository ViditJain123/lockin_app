import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { useEffect, useRef } from 'react';
import { Appearance, AppState, AppStateStatus, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import AppUpdateBanner from '../components/AppUpdateBanner';
import AppUpdateModal from '../components/AppUpdateModal';
import AuthScreen from '../components/AuthScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import AgeQuestionScreen from '../components/quiz/questions/AgeQuestionScreen';
import AppsQuestionScreen from '../components/quiz/questions/AppsQuestionScreen';
import DependenceResultScreen from '../components/quiz/questions/DependenceResultScreen';
import DesiredScreenTimeQuestionScreen from '../components/quiz/questions/DesiredScreenTimeQuestionScreen';
import GoalsQuestionScreen from '../components/quiz/questions/GoalsQuestionScreen';
import LifetimeUsageScreen from '../components/quiz/questions/LifetimeUsageScreen';
import LockInSavingsScreen from '../components/quiz/questions/LockInSavingsScreen';
import NameQuestionScreen from '../components/quiz/questions/NameQuestionScreen';
import ScienceReplacementScreen from '../components/quiz/questions/ScienceReplacementScreen';
import ScreenTimeQuestionScreen from '../components/quiz/questions/ScreenTimeQuestionScreen';
import ScrollScreen from '../components/quiz/questions/ScrollScreen';
import SleepTimeQuestionScreen from '../components/quiz/questions/SleepTimeQuestionScreen';
import SocialProofScreen from '../components/quiz/questions/SocialProofScreen';
import SolutionRevealScreen from '../components/quiz/questions/SolutionRevealScreen';
import TargetHoursQuestionScreen from '../components/quiz/questions/TargetHoursQuestionScreen';
import WorkingScreen from '../components/quiz/questions/WorkingScreen';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
// Family Controls screens
import ScreenTimePermissionScreen from '../components/quiz/questions/ScreenTimePermissionScreen';
import AppSelectionScreen from '../components/quiz/questions/AppSelectionScreen';
import HowItWorksScreen from '../components/quiz/questions/HowItWorksScreen';
import PaymentScreen from '../components/quiz/questions/PaymentScreen';
import PaymentSuccessScreen from '../components/quiz/questions/PaymentSuccessScreen';
import QuizLoginScreen from '../components/quiz/questions/QuizLoginScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { preloadAllBadges } from '../lib/badgeAssetCache';
import { refreshHeatmapFromSupabase } from '../lib/heatmapMigration';
import { migrateLocalDataToSupabase } from '../lib/dataMigration';
import { useTaskStore } from '../store/useTaskStore';
import { useBadgeStore } from '../store/useBadgeStore';
import { useGrindsStore } from '../store/useGrindsStore';
import { useVideoStore } from '../store/useVideoStore';
import { getEvents, onDeviceActivityMonitorEvent } from 'react-native-device-activity';
import { initializeDailyBlock, unblockApps, unblockAppsUnlimited, isBlockingAvailable } from '../lib/blockingService';
import { TOTAL_QUIZ_QUESTIONS, useOnboardingStore } from '../store/useOnboardingStore';
import { useEarnedTimeStore } from '../store/useEarnedTimeStore';
import { useEmergencyAccessStore } from '../store/useEmergencyAccessStore';

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
    // Quicksand font weights
    Quicksand_300Light,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    // Inter font weights
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Preload badge assets in background (fire and forget - don't block splash)
      preloadAllBadges();

      // Initialize subscription store (which initializes StoreKit)
      useSubscriptionStore.getState().initialize();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  // Force dark mode throughout the app
  const colorScheme = 'dark' as const;
  const { session, isInitialized } = useAuth();

  // App update state
  const {
    showForceUpdateModal,
    showSoftUpdateBanner,
    checkForUpdate,
    _hasHydrated: updateStoreHydrated,
  } = useAppUpdateStore();
  const appState = useRef(AppState.currentState);

  // Onboarding state
  const {
    shouldShowOnboarding,
    _hasHydrated,
    hasCompletedOnboarding,
    // Quiz funnel state
    isInQuizFunnel,
    currentQuestionIndex,
    quizAnswers,
    // Quiz funnel actions
    startQuizFunnel,
    goToNextQuestion,
    goToPreviousQuestion,
    setAnswer,
    completeQuizFunnel,
  } = useOnboardingStore();

  // Initialize notification system
  useNotificationSetup();

  // Keep the root view background color in sync with dark theme and force dark mode
  useEffect(() => {
    // Force dark mode at the React Native level
    Appearance.setColorScheme('dark');
    setBackgroundColorAsync('#000000');
  }, [colorScheme]);

  // Sync user data from Supabase on app launch (after auth)
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const runSync = async () => {
      try {
        // 0. Load videos from disk first (needed by migration + stats)
        await useVideoStore.getState().loadVideos();

        // 1. One-time migration of existing local data to Supabase
        await migrateLocalDataToSupabase(userId);

        // 2. Pull profile (if exists remotely but not locally, load it)
        if (!hasCompletedOnboarding) {
          await useOnboardingStore.getState().loadProfileFromSupabase();
        }

        // 3-6 run in parallel (independent)
        await Promise.all([
          useTaskStore.getState().syncTasksFromSupabase(),
          useBadgeStore.getState().loadBadgesFromSupabase(),
          refreshHeatmapFromSupabase(userId),
          useGrindsStore.getState().syncFromSupabase(userId),
        ]);
      } catch (err) {
        console.error('[Layout] Sync error:', err);
      }
    };

    runSync();
  }, [session?.user?.id]);

  // Check for app updates on launch and when app comes to foreground
  useEffect(() => {
    if (!updateStoreHydrated) return;

    // Check on initial mount
    checkForUpdate();

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - check for updates
        checkForUpdate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [updateStoreHydrated, checkForUpdate]);

  // Handle earned time daily reset and blocking on app foreground
  useEffect(() => {
    if (!_hasHydrated || !session) return;

    const { familyActivitySelection, targetHours } = quizAnswers;

    // Check iOS monitor events to detect if earned time was used up
    const checkIfTimeWasExhausted = (): boolean => {
      try {
        const earnedTimeStore = useEarnedTimeStore.getState();
        const { lastMonitoringStartedAt } = earnedTimeStore;

        const events = getEvents('earnedTimeMonitoring');
        const thresholdEvent = events.find(
          (e) =>
            e.callbackName === 'eventDidReachThreshold' &&
            e.eventName === 'timeExhausted' &&
            (lastMonitoringStartedAt == null ||
              new Date(e.lastCalledAt).getTime() > lastMonitoringStartedAt)
        );

        if (thresholdEvent) {
          console.log('[Layout] Detected timeExhausted event from iOS monitor');
          earnedTimeStore.markTimeExhausted();
          return true;
        }
      } catch (error) {
        console.log('[Layout] Error checking monitor events:', error);
      }
      return false;
    };

    // Check for new day and handle blocking state
    const handleBlockingState = () => {
      if (!isBlockingAvailable() || !familyActivitySelection) return;

      const earnedTimeStore = useEarnedTimeStore.getState();
      const emergencyStore = useEmergencyAccessStore.getState();

      // Reset passes for new day if needed
      emergencyStore.checkAndResetForNewDay();

      // Clean up expired emergency sessions → re-block if any expired
      const hadExpiredSession = emergencyStore.cleanupExpiredSessions();

      const wasNewDay = earnedTimeStore.checkAndResetForNewDay();

      if (wasNewDay) {
        // New day: reset blocking state
        console.log('[Layout] New day detected, initializing daily block');
        initializeDailyBlock(familyActivitySelection);
        return;
      }

      // If an active emergency session exists and hasn't expired, leave unblocked
      if (emergencyStore.hasActiveSession()) {
        console.log('[Layout] Active emergency session, leaving unblocked');
        return;
      }

      // If daily target reached, fully unlock (no usage monitor)
      if (earnedTimeStore.hasReachedDailyTarget(targetHours)) {
        console.log('[Layout] Daily target reached, unlimited unlock');
        unblockAppsUnlimited(familyActivitySelection);
        return;
      }

      // Check if iOS monitor has fired a threshold event since last unblock
      checkIfTimeWasExhausted();

      const remainingMinutes = earnedTimeStore.getRemainingTimeMinutes();
      if (remainingMinutes > 0) {
        // Has remaining earned time: ensure apps are unblocked with monitor
        console.log('[Layout] Same day with', remainingMinutes, 'min remaining, ensuring unblock');
        unblockApps(familyActivitySelection, remainingMinutes);
        earnedTimeStore.setMonitoringStartedAt(Date.now());
      } else {
        // No remaining time — ensure apps are blocked
        console.log('[Layout] No remaining time, ensuring apps are blocked');
        initializeDailyBlock(familyActivitySelection);
      }
    };

    // Run on mount
    handleBlockingState();

    // Listen for app state changes
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - check blocking state
        handleBlockingState();
      }
    });

    // Real-time listener for iOS monitor threshold events
    const monitorSubscription = onDeviceActivityMonitorEvent((event) => {
      if (event.callbackName === 'eventDidReachThreshold') {
        console.log('[Layout] Real-time eventDidReachThreshold received');
        const wasExhausted = checkIfTimeWasExhausted();
        if (wasExhausted && familyActivitySelection) {
          initializeDailyBlock(familyActivitySelection);
        }
      }
    });

    return () => {
      appStateSubscription.remove();
      monitorSubscription.remove();
    };
  }, [_hasHydrated, session, quizAnswers.familyActivitySelection, hasCompletedOnboarding]);

  // Hide splash screen once store hydration and auth initialization are both done
  useEffect(() => {
    if (_hasHydrated && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated, isInitialized]);

  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff';

  // Wait for store hydration and auth initialization before deciding what to show
  if (!_hasHydrated || !isInitialized) {
    return null;
  }

  // Show onboarding/quiz flow if needed (before auth)
  if (shouldShowOnboarding()) {
    // If in quiz funnel, show quiz screens
    if (isInQuizFunnel) {
      return (
        <GestureHandlerRootView style={styles.container}>
          <StatusBar style="light" />
          {/* Question 1: Name */}
          {currentQuestionIndex === 0 && (
            <NameQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              name={quizAnswers.name}
              onNameChange={(name) => setAnswer('name', name)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 2: Goals */}
          {currentQuestionIndex === 1 && (
            <GoalsQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              userName={quizAnswers.name}
              selectedGoals={quizAnswers.goals}
              onGoalsChange={(goals) => setAnswer('goals', goals)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 3: Screen Time */}
          {currentQuestionIndex === 2 && (
            <ScreenTimeQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              screenTime={quizAnswers.screenTime}
              onScreenTimeChange={(hours) => setAnswer('screenTime', hours)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 4: Desired Screen Time */}
          {currentQuestionIndex === 3 && (
            <DesiredScreenTimeQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              userName={quizAnswers.name}
              desiredScreenTime={quizAnswers.desiredScreenTime}
              onDesiredScreenTimeChange={(hours) => setAnswer('desiredScreenTime', hours)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 6: Social Proof */}
          {currentQuestionIndex === 4 && (
            <SocialProofScreen
              userName={quizAnswers.name}
              selectedGoals={quizAnswers.goals}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 7: Problematic Apps */}
          {currentQuestionIndex === 5 && (
            <AppsQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              selectedApps={quizAnswers.problematicApps}
              onAppsChange={(apps) => setAnswer('problematicApps', apps)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 8: Solution Reveal */}
          {currentQuestionIndex === 6 && (
            <SolutionRevealScreen
              selectedApps={quizAnswers.problematicApps}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 9: Age */}
          {currentQuestionIndex === 7 && (
            <AgeQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              selectedAge={quizAnswers.age}
              onAgeChange={(age) => setAnswer('age', age)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 10: Dependence Result */}
          {currentQuestionIndex === 8 && (
            <DependenceResultScreen
              screenTime={quizAnswers.screenTime}
              desiredScreenTime={quizAnswers.desiredScreenTime}
              problematicApps={quizAnswers.problematicApps}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 11: Lifetime Usage */}
          {currentQuestionIndex === 9 && (
            <LifetimeUsageScreen
              screenTime={quizAnswers.screenTime}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 12: LockIn Savings */}
          {currentQuestionIndex === 10 && (
            <LockInSavingsScreen
              screenTime={quizAnswers.screenTime}
              desiredScreenTime={quizAnswers.desiredScreenTime}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 13: Science Replacement */}
          {currentQuestionIndex === 11 && (
            <ScienceReplacementScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 14: Sleep Time */}
          {currentQuestionIndex === 12 && (
            <SleepTimeQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              userName={quizAnswers.name}
              sleepTime={quizAnswers.sleepTime}
              onSleepTimeChange={(sleepTime) => setAnswer('sleepTime', sleepTime)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 15: Target Hours */}
          {currentQuestionIndex === 13 && (
            <TargetHoursQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              userName={quizAnswers.name}
              targetHours={quizAnswers.targetHours}
              onTargetHoursChange={(hours) => setAnswer('targetHours', hours)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 16: Scroll Screen */}
          {currentQuestionIndex === 14 && (
            <ScrollScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 17: Working Screen */}
          {currentQuestionIndex === 15 && (
            <WorkingScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 18: Screen Time Permission */}
          {currentQuestionIndex === 16 && (
            <ScreenTimePermissionScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 19: App Selection */}
          {currentQuestionIndex === 17 && (
            <AppSelectionScreen
              familyActivitySelection={quizAnswers.familyActivitySelection}
              onSelectionChange={(selection) => setAnswer('familyActivitySelection', selection)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 20: How It Works (replaced ConversionRate) */}
          {currentQuestionIndex === 18 && (
            <HowItWorksScreen
              userName={quizAnswers.name}
              targetHours={quizAnswers.targetHours}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 21: Login Screen */}
          {currentQuestionIndex === 19 && (
            <QuizLoginScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 22: Payment Screen */}
          {currentQuestionIndex === 20 && (
            <PaymentScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 23: Payment Success Screen */}
          {currentQuestionIndex === 21 && (
            <PaymentSuccessScreen
              userName={quizAnswers.name}
              onContinue={completeQuizFunnel}
            />
          )}
        </GestureHandlerRootView>
      );
    }

    // Show initial onboarding screen
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={startQuizFunnel} />
      </GestureHandlerRootView>
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="preview"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_bottom',
              contentStyle: {
                backgroundColor: 'black',
              },
            }}
          />
          <Stack.Screen
            name="grind-complete"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false,
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'black' },
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
          <Stack.Screen
            name="emergency-access"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false,
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'black' },
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="settings-page"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="trophies-page"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>

        {/* App Update Components */}
        <AppUpdateBanner visible={showSoftUpdateBanner} />
        <AppUpdateModal visible={showForceUpdateModal} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
