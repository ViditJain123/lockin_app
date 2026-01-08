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
import OnboardingScreen from '../components/OnboardingScreen';
import AppsQuestionScreen from '../components/quiz/questions/AppsQuestionScreen';
import DesiredScreenTimeQuestionScreen from '../components/quiz/questions/DesiredScreenTimeQuestionScreen';
import GoalsQuestionScreen from '../components/quiz/questions/GoalsQuestionScreen';
import NameQuestionScreen from '../components/quiz/questions/NameQuestionScreen';
import ScreenTimeQuestionScreen from '../components/quiz/questions/ScreenTimeQuestionScreen';
import SocialProofScreen from '../components/quiz/questions/SocialProofScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useOnboardingStore, TOTAL_QUIZ_QUESTIONS } from '../store/useOnboardingStore';

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
      SplashScreen.hideAsync();
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

  // Keep the root view background color in sync with dark theme and force dark mode
  useEffect(() => {
    // Force dark mode at the React Native level
    Appearance.setColorScheme('dark');
    setBackgroundColorAsync('#000000');
  }, [colorScheme]);

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
          {/* Question 5: Social Proof */}
          {currentQuestionIndex === 4 && (
            <SocialProofScreen
              userName={quizAnswers.name}
              selectedGoals={quizAnswers.goals}
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Question 6: Problematic Apps */}
          {currentQuestionIndex === 5 && (
            <AppsQuestionScreen
              currentStep={currentQuestionIndex + 1}
              totalSteps={TOTAL_QUIZ_QUESTIONS}
              selectedApps={quizAnswers.problematicApps}
              onAppsChange={(apps) => setAnswer('problematicApps', apps)}
              onContinue={completeQuizFunnel}
              onBack={goToPreviousQuestion}
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
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
