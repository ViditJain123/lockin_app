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
import { useEffect } from 'react';
import { Appearance, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import AuthScreen from '../components/AuthScreen';
import HardPaywallScreen from '../components/HardPaywallScreen';
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
import { useSubscriptionStore, useIsSubscribed } from '../store/useSubscriptionStore';
// Family Controls screens
import ScreenTimePermissionScreen from '../components/quiz/questions/ScreenTimePermissionScreen';
import AppSelectionScreen from '../components/quiz/questions/AppSelectionScreen';
import HowItWorksScreen from '../components/quiz/questions/HowItWorksScreen';
import NotificationPermissionScreen from '../components/quiz/questions/NotificationPermissionScreen';
import PaymentScreen from '../components/quiz/questions/PaymentScreen';
import PaymentSuccessScreen from '../components/quiz/questions/PaymentSuccessScreen';
import QuizLoginScreen from '../components/quiz/questions/QuizLoginScreen';
import TrophyReceivedModal from '../components/TrophyReceivedModal';
import { getBadgeById } from '../constants/Badges';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { preloadAllBadges } from '../lib/badgeAssetCache';
import { useBadgeStore, usePendingNewBadges } from '../store/useBadgeStore';
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
      // Initialize subscription store (which initializes StoreKit)
      useSubscriptionStore.getState().initialize();
      // Preload badge assets (fire and forget)
      preloadAllBadges();
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

  // Subscription state
  const isSubscribed = useIsSubscribed();
  const subscriptionInitialized = useSubscriptionStore((state) => state.isInitialized);

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

  // Keep the root view background color in sync with dark theme and force dark mode
  useEffect(() => {
    // Force dark mode at the React Native level
    Appearance.setColorScheme('dark');
    setBackgroundColorAsync('#000000');
  }, [colorScheme]);

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
          {/* Question 21: Notification Permission */}
          {currentQuestionIndex === 19 && (
            <NotificationPermissionScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 22: Login Screen */}
          {currentQuestionIndex === 20 && (
            <QuizLoginScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 23: Payment Screen */}
          {currentQuestionIndex === 21 && (
            <PaymentScreen
              onContinue={goToNextQuestion}
            />
          )}
          {/* Question 24: Payment Success Screen */}
          {currentQuestionIndex === 22 && (
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

  // Wait for subscription store to initialize before deciding paywall
  if (hasCompletedOnboarding && !subscriptionInitialized) {
    return null; // Keep splash screen visible
  }

  // Hard paywall gate — block access if not subscribed
  if (hasCompletedOnboarding && !isSubscribed) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <HardPaywallScreen />
      </GestureHandlerRootView>
    );
  }

  // Trophy modal state - show one pending badge at a time
  const pendingNewBadges = usePendingNewBadges();
  const firstPendingBadge = pendingNewBadges.length > 0 ? getBadgeById(pendingNewBadges[0]) : null;

  const handleDismissTrophy = () => {
    if (pendingNewBadges.length > 0) {
      useBadgeStore.getState().markBadgeAsSeen(pendingNewBadges[0]);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          <Stack.Screen name="trophies-page" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        <TrophyReceivedModal
          visible={!!firstPendingBadge}
          badge={firstPendingBadge ?? null}
          onClose={handleDismissTrophy}
          onAddToCollection={handleDismissTrophy}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
