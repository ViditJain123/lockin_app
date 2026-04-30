import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
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
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { useCallback, useEffect } from 'react';
import { Appearance, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';

import AuthScreen from '../components/AuthScreen';
import TabletContainer from '../components/TabletContainer';
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
import { useIsSubscribed, useSubscriptionStore } from '../store/useSubscriptionStore';
// Family Controls screens
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import {
  blockSelection,
  getAppGroupFileDirectory,
  onDeviceActivityMonitorEvent,
  setFamilyActivitySelectionId,
  updateShield,
} from 'react-native-device-activity';
import AppSelectionScreen from '../components/quiz/questions/AppSelectionScreen';
import HowItWorksScreen from '../components/quiz/questions/HowItWorksScreen';
import NotificationPermissionScreen from '../components/quiz/questions/NotificationPermissionScreen';
import PaymentScreen from '../components/quiz/questions/PaymentScreen';
import PaymentSuccessScreen from '../components/quiz/questions/PaymentSuccessScreen';
import QuizLoginScreen from '../components/quiz/questions/QuizLoginScreen';
import ScreenTimePermissionScreen from '../components/quiz/questions/ScreenTimePermissionScreen';
import CrystalReceivedModal from '../components/CrystalReceivedModal';
import { getCrystalById } from '../constants/Crystals';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { fullyUnlockApps as fullyUnlockAppsManager } from '../lib/appLockManager';
import { scheduleSleepTimeLock } from '../lib/appLockScheduler';
import { parseUTMParams, storePendingAttribution } from '../lib/attribution';
import { preloadAllCrystals } from '../lib/crystalAssetCache';
import { getLocalDateString } from '../lib/dateUtils';
import { convertSleepTimeTo24h, upsertUserRow } from '../lib/supabaseUser';
import { useAppLockStore } from '../store/useAppLockStore';
import { useCrystalStore, usePendingNewCrystals } from '../store/useCrystalStore';
import { TOTAL_QUIZ_QUESTIONS, useOnboardingStore } from '../store/useOnboardingStore';
import { useSessionStore } from '../store/useSessionStore';
import { posthog } from '../lib/posthog';

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
    // Lockin Club redesign — display + mono
    BebasNeue_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Initialize subscription store (which initializes StoreKit)
      useSubscriptionStore.getState().initialize();
      // Preload crystal assets (fire and forget)
      preloadAllCrystals();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PostHogProvider client={posthog}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PostHogProvider>
  );
}

function RootLayoutNav() {
  // Initialize notification system
  useNotificationSetup();

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

  // Crystal modal state — must be declared before any early return.
  const pendingNewCrystals = usePendingNewCrystals();
  const firstPendingCrystal =
    pendingNewCrystals.length > 0 ? getCrystalById(pendingNewCrystals[0]) ?? null : null;
  const handleDismissCrystal = useCallback(() => {
    if (pendingNewCrystals.length > 0) {
      useCrystalStore.getState().markCrystalAsSeen(pendingNewCrystals[0]);
    }
  }, [pendingNewCrystals]);

  // Analytics: a crystal earned is the new "badge earned" signal.
  useEffect(() => {
    if (firstPendingCrystal) {
      posthog.capture('crystal_earned', {
        crystal_id: firstPendingCrystal.id,
        crystal_name: firstPendingCrystal.name,
        tier: firstPendingCrystal.tier,
        milestone_level: firstPendingCrystal.milestoneLevel,
      });
    }
  }, [firstPendingCrystal?.id]);

  // Deep link listener for UTM attribution
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) {
        const params = parseUTMParams(url);
        if (params) storePendingAttribution(params);
      }
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const params = parseUTMParams(url);
      if (params) storePendingAttribution(params);
    });
    return () => sub.remove();
  }, []);

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

  // Initialize app lock system after auth + onboarding
  useEffect(() => {
    if (!_hasHydrated || !isInitialized || !session || !hasCompletedOnboarding) return;

    const { sleepTime, familyActivitySelection } = useOnboardingStore.getState().quizAnswers;

    // Store the family activity selection ID for use in actions
    if (familyActivitySelection) {
      setFamilyActivitySelectionId({
        id: 'onboardingSelection',
        familyActivitySelection,
      });
    }

    // Schedule sleep time lock
    const time24h = convertSleepTimeTo24h(sleepTime);
    const [h, m] = time24h.split(':').map(Number);
    scheduleSleepTimeLock(h, m);

    // Copy logo to app group so the shield extension can display it
    const copyLogoAndConfigureShield = async () => {
      let iconPath: string | undefined;
      try {
        const appGroupDir = getAppGroupFileDirectory();
        if (appGroupDir) {
          const asset = Asset.fromModule(require('../assets/images/logo-no-bg-cropped.png'));
          await asset.downloadAsync();
          if (asset.localUri) {
            const destPath = appGroupDir + '/shield-logo.png';
            await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
            iconPath = 'shield-logo.png';
          }
        }
      } catch (e) {
        console.warn('[Shield] Failed to copy logo to app group:', e);
      }

      // Configure shield appearance
      updateShield(
        {
          ...(iconPath ? { iconAppGroupRelativePath: iconPath } : { iconSystemName: 'lock.shield.fill' }),
          title: 'App is locked',
          subtitle: 'Profile -> Settings -> Claim to unlock',
          backgroundColor: { red: 0, green: 0, blue: 0 },
          titleColor: { red: 255, green: 255, blue: 255 },
          subtitleColor: { red: 200, green: 200, blue: 200 },
        },
        {},
        'appLockInit'
      );
    };
    copyLogoAndConfigureShield();

    // Check if daily reset is needed
    useAppLockStore.getState().resetDaily();

    // Apply any pending settings that are scheduled for today or earlier
    const applied = useOnboardingStore.getState().applyPendingSettings();
    if (applied) {
      if (applied.sleepTime) {
        const newTime24h = convertSleepTimeTo24h(useOnboardingStore.getState().quizAnswers.sleepTime);
        const [newH, newM] = newTime24h.split(':').map(Number);
        scheduleSleepTimeLock(newH, newM);
      }
      if (applied.familyActivitySelection !== undefined && applied.familyActivitySelection) {
        setFamilyActivitySelectionId({ id: 'onboardingSelection', familyActivitySelection: applied.familyActivitySelection });
        blockSelection({ activitySelectionToken: applied.familyActivitySelection }, 'pendingApply');
      }
      if (session?.user?.id) {
        const sync: Record<string, unknown> = { pending_target_hours: null, pending_sleep_time: null, pending_settings_date: null };
        if (applied.targetHours !== undefined) sync.target_hours = applied.targetHours;
        if (applied.sleepTime) sync.sleep_time = convertSleepTimeTo24h(applied.sleepTime);
        upsertUserRow(session.user.id, sync).catch(console.warn);
      }
    }

    // Re-apply device-level unlock if target was already completed today
    const appLockState = useAppLockStore.getState();
    if (appLockState.isFullyUnlocked) {
      fullyUnlockAppsManager();
    } else {
      // Safety check: compute today's focus from session data (same source as analytics)
      // If target is met but isFullyUnlocked got out of sync, trigger unlock
      const todayStr = getLocalDateString();
      const todaySessions = useSessionStore.getState().sessions.filter(s => s.date === todayStr);
      const totalFocusSeconds = todaySessions.reduce((sum, s) => sum + s.total_locked_in_seconds, 0);
      const targetHours = useOnboardingStore.getState().quizAnswers.targetHours;
      if (totalFocusSeconds >= targetHours * 3600) {
        useAppLockStore.getState().fullyUnlockApps();
      }
    }

    // Listen for re-lock events from device activity monitor
    const subscription = onDeviceActivityMonitorEvent((event) => {
      if (event.callbackName === 'eventDidReachThreshold') {
        useAppLockStore.getState().relockApps();
      }
      if (event.callbackName === 'intervalDidStart') {
        useAppLockStore.getState().lockAppsForSleep();
        // Also apply any pending settings at this daily boundary
        useOnboardingStore.getState().applyPendingSettings();
      }
    });

    return () => subscription.remove();
  }, [_hasHydrated, isInitialized, session, hasCompletedOnboarding]);

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
          <TabletContainer>
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
              onContinue={() => {
                // Sync onboarding data to Supabase before completing
                if (session?.user?.id) {
                  const { sleepTime, targetHours, familyActivitySelection } = quizAnswers;
                  upsertUserRow(session.user.id, {
                    sleep_time: convertSleepTimeTo24h(sleepTime),
                    target_hours: targetHours,
                  }).catch((err) => console.warn('[Onboarding] Failed to sync:', err));

                  // Store the family activity selection ID
                  if (familyActivitySelection) {
                    setFamilyActivitySelectionId({
                      id: 'onboardingSelection',
                      familyActivitySelection,
                    });
                  }
                }
                posthog.capture('onboarding_completed');
                completeQuizFunnel();
              }}
            />
          )}
          </TabletContainer>
        </GestureHandlerRootView>
      );
    }

    // Show initial onboarding screen
    return (
      <GestureHandlerRootView style={styles.container}>
        <TabletContainer>
          <StatusBar style="light" />
          <OnboardingScreen onComplete={() => {
            posthog.capture('quiz_started');
            startQuizFunnel();
          }} />
        </TabletContainer>
      </GestureHandlerRootView>
    );
  }

  // Show auth screen if not authenticated
  if (!session) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <TabletContainer>
          <StatusBar style="light" />
          <AuthScreen />
        </TabletContainer>
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
        <TabletContainer>
          <StatusBar style="light" />
          <HardPaywallScreen />
        </TabletContainer>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <TabletContainer>
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
          <Stack.Screen
            name="grind-complete"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="settings-page" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="record" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="stopwatch" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        </Stack>
        <CrystalReceivedModal
          visible={!!firstPendingCrystal}
          crystal={firstPendingCrystal}
          onClose={handleDismissCrystal}
          onAddToCollection={handleDismissCrystal}
        />
      </ThemeProvider>
      </TabletContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
