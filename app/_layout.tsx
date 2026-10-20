import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans';
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
import OnboardingScreen from '../components/OnboardingScreen';
import GoalsQuestionScreen from '../components/quiz/questions/GoalsQuestionScreen';
import NameQuestionScreen from '../components/quiz/questions/NameQuestionScreen';
import ScreenTimeQuestionScreen from '../components/quiz/questions/ScreenTimeQuestionScreen';
import SleepTimeQuestionScreen from '../components/quiz/questions/SleepTimeQuestionScreen';
import TargetHoursQuestionScreen from '../components/quiz/questions/TargetHoursQuestionScreen';
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
import NotificationPermissionScreen from '../components/quiz/questions/NotificationPermissionScreen';
import WelcomeScreen from '../components/quiz/questions/WelcomeScreen';
import QuizLoginScreen from '../components/quiz/questions/QuizLoginScreen';
import ScreenTimePermissionScreen from '../components/quiz/questions/ScreenTimePermissionScreen';
import CrystalReceivedModal from '../components/CrystalReceivedModal';
import { getCrystalById } from '../constants/Crystals';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { cancelTrialEndNotification } from '../lib/notificationService';
import { IS_ANDROID } from '../lib/androidDefaultUser';
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
    // DM Sans (wordmark)
    DMSans_700Bold,
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
      // The app is free now; clear any trial reminder scheduled by older builds
      cancelTrialEndNotification().catch(() => {});
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
    setBackgroundColorAsync('#0E0E0E');
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
          backgroundColor: { red: 14, green: 14, blue: 14 },
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

  const backgroundColor = colorScheme === 'dark' ? '#0E0E0E' : '#ffffff';

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
          {/* Question 4: Sleep Time */}
          {currentQuestionIndex === 3 && (
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
          {/* Question 5: Target Hours */}
          {currentQuestionIndex === 4 && (
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
          {/* Screen Time Permission (iOS) */}
          {currentQuestionIndex === 5 && (
            <ScreenTimePermissionScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Notification Permission */}
          {currentQuestionIndex === 6 && (
            <NotificationPermissionScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Login */}
          {currentQuestionIndex === 7 && (
            <QuizLoginScreen
              onContinue={goToNextQuestion}
              onBack={goToPreviousQuestion}
            />
          )}
          {/* Welcome (completes the funnel on Android) */}
          {currentQuestionIndex === 8 && (
            <WelcomeScreen
              userName={quizAnswers.name}
              onContinue={Platform.OS === 'ios' ? goToNextQuestion : () => {
                // Android skips the final AppSelectionScreen (FamilyControls
                // is iOS-only), so the completion side effects that normally
                // run from AppSelectionScreen.onContinue have to fire here.
                if (session?.user?.id) {
                  const { sleepTime, targetHours } = quizAnswers;
                  upsertUserRow(session.user.id, {
                    sleep_time: convertSleepTimeTo24h(sleepTime),
                    target_hours: targetHours,
                  }).catch((err) => console.warn('[Onboarding] Failed to sync:', err));
                }
                posthog.capture('onboarding_completed');
                completeQuizFunnel();
              }}
            />
          )}
          {/* App Selection (iOS final step, completes funnel) */}
          {currentQuestionIndex === 9 && (
            <AppSelectionScreen
              familyActivitySelection={quizAnswers.familyActivitySelection}
              onSelectionChange={(selection) => setAnswer('familyActivitySelection', selection)}
              onContinue={() => {
                if (session?.user?.id) {
                  const { sleepTime, targetHours, familyActivitySelection } = quizAnswers;
                  upsertUserRow(session.user.id, {
                    sleep_time: convertSleepTimeTo24h(sleepTime),
                    target_hours: targetHours,
                  }).catch((err) => console.warn('[Onboarding] Failed to sync:', err));

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
              onBack={goToPreviousQuestion}
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
          <Stack.Screen name="photo-capture" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="photo-preview" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
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
