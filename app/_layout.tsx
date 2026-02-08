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
import SleepTimeQuestionScreen from '../components/quiz/questions/SleepTimeQuestionScreen';
import SolutionRevealScreen from '../components/quiz/questions/SolutionRevealScreen';
import TargetHoursQuestionScreen from '../components/quiz/questions/TargetHoursQuestionScreen';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import PaymentScreen from '../components/quiz/questions/PaymentScreen';
import PaymentSuccessScreen from '../components/quiz/questions/PaymentSuccessScreen';
import QuizLoginScreen from '../components/quiz/questions/QuizLoginScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { preloadAllBadges } from '../lib/badgeAssetCache';
import { migrateHeatmapData } from '../lib/heatmapMigration';
import { TOTAL_QUIZ_QUESTIONS, useOnboardingStore } from '../store/useOnboardingStore';

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

      SplashScreen.hideAsync();
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
  const { session } = useAuth();

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

  // Run one-time heatmap migration when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      migrateHeatmapData(session.user.id);
    }
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

  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff';

  // Wait for store hydration before deciding what to show
  if (!_hasHydrated) {
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
          {/* Question 5: Problematic Apps */}
          {currentQuestionIndex === 4 && (
            <AppsQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              selectedApps={quizAnswers.problematicApps}
              onAppsChange={(apps) => setAnswer('problematicApps', apps)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 6: Solution Reveal */}
          {currentQuestionIndex === 5 && (
            <SolutionRevealScreen
              selectedApps={quizAnswers.problematicApps}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 7: Age */}
          {currentQuestionIndex === 6 && (
            <AgeQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              selectedAge={quizAnswers.age}
              onAgeChange={(age) => setAnswer('age', age)}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 8: Dependence Result */}
          {currentQuestionIndex === 7 && (
            <DependenceResultScreen
              screenTime={quizAnswers.screenTime}
              desiredScreenTime={quizAnswers.desiredScreenTime}
              problematicApps={quizAnswers.problematicApps}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 9: Lifetime Usage */}
          {currentQuestionIndex === 8 && (
            <LifetimeUsageScreen
              screenTime={quizAnswers.screenTime}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 10: LockIn Savings */}
          {currentQuestionIndex === 9 && (
            <LockInSavingsScreen
              screenTime={quizAnswers.screenTime}
              desiredScreenTime={quizAnswers.desiredScreenTime}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 11: Science Replacement */}
          {currentQuestionIndex === 10 && (
            <ScienceReplacementScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 12: Sleep Time */}
          {currentQuestionIndex === 11 && (
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
          {/* Question 13: Target Hours */}
          {currentQuestionIndex === 12 && (
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
          {/* Question 14: Login Screen */}
          {currentQuestionIndex === 13 && (
            <QuizLoginScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 15: Payment Screen */}
          {currentQuestionIndex === 14 && (
            <PaymentScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 16: Payment Success Screen */}
          {currentQuestionIndex === 15 && (
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
