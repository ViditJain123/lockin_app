import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ANDROID_DEFAULT_NAME,
  ANDROID_DEFAULT_TARGET_HOURS,
  IS_ANDROID,
} from '../lib/androidDefaultUser';
import { ONBOARDING_DEV_MODE } from '../lib/config';
import { getLocalDateString, getTomorrowDateString } from '../lib/dateUtils';

// Storage keys
const ONBOARDING_STORAGE_KEY = 'lockin-onboarding-state';

// Total number of quiz questions (including login screen)
export const TOTAL_QUIZ_QUESTIONS = 20;

// Indices that depend on iOS-only FamilyControls / DeviceActivity APIs and
// don't have an Android equivalent. The navigation actions skip these on
// Android so the user never lands on a screen that can't function.
//   13 → ScreenTimePermissionScreen
//   19 → AppSelectionScreen (final app-lock step)
const PLATFORM_SKIP_INDICES = new Set<number>(
  Platform.OS === 'ios' ? [] : [13, 19],
);

// Interface for sleep time
export interface SleepTime {
  hour: number; // 1-12
  minute: number; // 0, 15, 30, 45
  period: 'AM' | 'PM';
}

// Conversion rate type — kept for backward compat with persisted data, no longer used in quiz flow
export type ConversionRate = '6:1' | '4:1' | '3:1';

// Pending settings that take effect next day
export type PendingSettingKey = 'targetHours' | 'sleepTime' | 'familyActivitySelection';

export interface PendingSettings {
  targetHours?: number;
  sleepTime?: SleepTime;
  familyActivitySelection?: string | null;
  scheduledDate: string; // YYYY-MM-DD — the date these take effect
}

// Interface for quiz answers
export interface QuizAnswers {
  name: string;
  goals: string[];
  screenTime: number;
  desiredScreenTime: number;
  problematicApps: string[];
  age: string;
  sleepTime: SleepTime;
  familyActivitySelection: string | null;
  targetHours: number;
}

interface OnboardingState {
  // Toggle: When true, show onboarding every time. When false, show only once.
  showOnboardingAlways: boolean;
  // Track if user has completed onboarding
  hasCompletedOnboarding: boolean;
  // Hydration state
  _hasHydrated: boolean;

  // Quiz funnel state
  isInQuizFunnel: boolean;
  currentQuestionIndex: number;
  quizAnswers: QuizAnswers;

  // Pending settings (deferred to next day)
  pendingSettings: PendingSettings | null;

  // Timestamp for conflict resolution
  localUpdatedAt: number;

  // Actions
  setHasHydrated: (state: boolean) => void;
  shouldShowOnboarding: () => boolean;
  completeOnboarding: () => void;
  setShowOnboardingAlways: (value: boolean) => void;
  resetOnboarding: () => void;

  // Quiz funnel actions
  startQuizFunnel: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  setAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  completeQuizFunnel: () => void;
  exitQuizFunnel: () => void;

  // Pending settings actions
  setPendingSetting: <K extends PendingSettingKey>(key: K, value: PendingSettings[K]) => void;
  applyPendingSettings: () => Partial<PendingSettings> | null;
  cancelPendingSetting: (key: PendingSettingKey) => void;

  // Called by sync engine after conflict resolution
  updateFromRemote: (profile: QuizAnswers, hasCompleted: boolean) => void;

  // Clear quiz answers on logout (keeps hasCompletedOnboarding)
  clearQuizAnswers: () => void;
}

const initialQuizAnswers: QuizAnswers = {
  name: IS_ANDROID ? ANDROID_DEFAULT_NAME : '',
  goals: [],
  screenTime: 4, // Default to 4 hours
  desiredScreenTime: 2, // Default to 2 hours
  problematicApps: [],
  age: '',
  sleepTime: { hour: 10, minute: 0, period: 'PM' }, // Default to 10:00 PM
  familyActivitySelection: null,
  targetHours: IS_ANDROID ? ANDROID_DEFAULT_TARGET_HOURS : 4,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Default: show onboarding only once (set to true for testing/debugging)
      showOnboardingAlways: false,
      // Android skips onboarding entirely — default identity is preloaded.
      hasCompletedOnboarding: IS_ANDROID,
      _hasHydrated: false,

      // Quiz funnel initial state
      isInQuizFunnel: false,
      currentQuestionIndex: 0,
      quizAnswers: initialQuizAnswers,

      // Pending settings
      pendingSettings: null,

      // Conflict resolution timestamp
      localUpdatedAt: 0,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Determine if onboarding should be shown
      shouldShowOnboarding: () => {
        // Android never shows onboarding — defensive guard against any
        // persisted state that pre-dates this change.
        if (IS_ANDROID) return false;

        const { showOnboardingAlways, hasCompletedOnboarding } = get();

        // DEV MODE handling
        if (ONBOARDING_DEV_MODE === 'skip') {
          return false;
        }
        if (ONBOARDING_DEV_MODE === 'force') {
          return true;
        }

        // Normal production behavior (ONBOARDING_DEV_MODE === 'normal')
        if (showOnboardingAlways) {
          return true;
        }
        return !hasCompletedOnboarding;
      },

      // Mark onboarding as completed
      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
        });
      },

      // Update the toggle setting
      setShowOnboardingAlways: (value: boolean) => {
        set({ showOnboardingAlways: value });
      },

      // Reset for testing/debugging
      resetOnboarding: () => {
        set({
          // Android keeps onboarding "complete" because there's no flow to run.
          hasCompletedOnboarding: IS_ANDROID,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
          quizAnswers: initialQuizAnswers,
          localUpdatedAt: 0,
        });
      },

      // Start the quiz funnel
      startQuizFunnel: () => {
        set({
          isInQuizFunnel: true,
          currentQuestionIndex: 0,
          quizAnswers: initialQuizAnswers,
        });
      },

      // Move to next question
      goToNextQuestion: () => {
        const { currentQuestionIndex } = get();
        let next = currentQuestionIndex + 1;
        while (PLATFORM_SKIP_INDICES.has(next) && next < TOTAL_QUIZ_QUESTIONS) {
          next++;
        }
        if (next < TOTAL_QUIZ_QUESTIONS) {
          set({ currentQuestionIndex: next });
        }
        // If we ran off the end (Android skipping the final app-lock step),
        // the screen at currentQuestionIndex is responsible for completing
        // the funnel — see _layout.tsx PaymentSuccessScreen onContinue.
      },

      // Move to previous question
      goToPreviousQuestion: () => {
        const { currentQuestionIndex } = get();
        let prev = currentQuestionIndex - 1;
        while (PLATFORM_SKIP_INDICES.has(prev) && prev > 0) {
          prev--;
        }
        if (prev >= 0) {
          set({ currentQuestionIndex: prev });
        } else {
          // If on first question, exit quiz funnel back to initial onboarding
          set({ isInQuizFunnel: false });
        }
      },

      // Set a specific answer
      setAnswer: (key, value) => {
        set((state) => ({
          quizAnswers: {
            ...state.quizAnswers,
            [key]: value,
          },
        }));
      },

      // Complete the quiz funnel
      completeQuizFunnel: () => {
        const now = Date.now();
        set({
          hasCompletedOnboarding: true,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
          showOnboardingAlways: false, // Ensure debug flag is off
          localUpdatedAt: now,
        });

      },

      // Exit quiz funnel without completing
      exitQuizFunnel: () => {
        set({
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
          quizAnswers: initialQuizAnswers,
        });
      },

      // Merge a value into pendingSettings, scheduled for tomorrow
      setPendingSetting: (key, value) => {
        set((state) => {
          const existing = state.pendingSettings ?? { scheduledDate: getTomorrowDateString() };
          return {
            pendingSettings: {
              ...existing,
              scheduledDate: getTomorrowDateString(),
              [key]: value,
            },
          };
        });
      },

      // Apply pending settings if today >= scheduledDate. Returns applied values or null.
      applyPendingSettings: () => {
        const { pendingSettings } = get();
        if (!pendingSettings) return null;

        const today = getLocalDateString();
        if (today < pendingSettings.scheduledDate) return null;

        // Copy pending values into quizAnswers
        const applied: Partial<PendingSettings> = {};
        set((state) => {
          const updated = { ...state.quizAnswers };
          if (pendingSettings.targetHours !== undefined) {
            updated.targetHours = pendingSettings.targetHours;
            applied.targetHours = pendingSettings.targetHours;
          }
          if (pendingSettings.sleepTime !== undefined) {
            updated.sleepTime = pendingSettings.sleepTime;
            applied.sleepTime = pendingSettings.sleepTime;
          }
          if (pendingSettings.familyActivitySelection !== undefined) {
            updated.familyActivitySelection = pendingSettings.familyActivitySelection;
            applied.familyActivitySelection = pendingSettings.familyActivitySelection;
          }
          return { quizAnswers: updated, pendingSettings: null };
        });

        return Object.keys(applied).length > 0 ? applied : null;
      },

      // Remove a single key from pending settings
      cancelPendingSetting: (key) => {
        set((state) => {
          if (!state.pendingSettings) return state;
          const updated = { ...state.pendingSettings };
          delete updated[key];
          // If only scheduledDate remains, clear entirely
          const remainingKeys = Object.keys(updated).filter((k) => k !== 'scheduledDate');
          return { pendingSettings: remainingKeys.length > 0 ? updated : null };
        });
      },

      // Called by sync engine — sets resolved profile data
      updateFromRemote: (profile: QuizAnswers, hasCompleted: boolean) => {
        set({
          quizAnswers: profile,
          hasCompletedOnboarding: hasCompleted,
        });
      },

      // Clear quiz answers without resetting hasCompletedOnboarding (device-level flag)
      clearQuizAnswers: () => {
        set({
          quizAnswers: initialQuizAnswers,
          localUpdatedAt: 0,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
        });
      },
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        showOnboardingAlways: state.showOnboardingAlways,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        quizAnswers: state.quizAnswers,
        pendingSettings: state.pendingSettings,
        localUpdatedAt: state.localUpdatedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
