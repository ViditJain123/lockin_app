import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ONBOARDING_DEV_MODE } from '../lib/config';

// Storage keys
const ONBOARDING_STORAGE_KEY = 'lockin-onboarding-state';

// Total number of quiz questions (including login screen)
export const TOTAL_QUIZ_QUESTIONS = 22;

// Interface for sleep time
export interface SleepTime {
  hour: number; // 1-12
  minute: number; // 0, 15, 30, 45
  period: 'AM' | 'PM';
}

// Conversion rate type — kept for backward compat with persisted data, no longer used in quiz flow
export type ConversionRate = '6:1' | '4:1' | '3:1';

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
}

const initialQuizAnswers: QuizAnswers = {
  name: '',
  goals: [],
  screenTime: 4, // Default to 4 hours
  desiredScreenTime: 2, // Default to 2 hours
  problematicApps: [],
  age: '',
  sleepTime: { hour: 10, minute: 0, period: 'PM' }, // Default to 10:00 PM
  familyActivitySelection: null,
  targetHours: 4, // Default to 4 hours of daily work target
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Default: show onboarding only once (set to true for testing/debugging)
      showOnboardingAlways: false,
      hasCompletedOnboarding: false,
      _hasHydrated: false,

      // Quiz funnel initial state
      isInQuizFunnel: false,
      currentQuestionIndex: 0,
      quizAnswers: initialQuizAnswers,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Determine if onboarding should be shown
      shouldShowOnboarding: () => {
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
          hasCompletedOnboarding: false,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
          quizAnswers: initialQuizAnswers,
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
        if (currentQuestionIndex < TOTAL_QUIZ_QUESTIONS - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      // Move to previous question
      goToPreviousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
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
        set({
          hasCompletedOnboarding: true,
          isInQuizFunnel: false,
          currentQuestionIndex: 0,
          showOnboardingAlways: false, // Ensure debug flag is off
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
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        showOnboardingAlways: state.showOnboardingAlways,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        quizAnswers: state.quizAnswers,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
