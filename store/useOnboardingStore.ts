import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Storage keys
const ONBOARDING_STORAGE_KEY = 'lockin-onboarding-state';

// Total number of quiz questions
export const TOTAL_QUIZ_QUESTIONS = 12;

// Interface for quiz answers
export interface QuizAnswers {
  name: string;
  goals: string[];
  screenTime: number;
  desiredScreenTime: number;
  problematicApps: string[];
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
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Default: show onboarding always (as requested)
      showOnboardingAlways: true,
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
        
        // If toggle is ON, always show onboarding
        if (showOnboardingAlways) {
          return true;
        }
        
        // If toggle is OFF, only show if user hasn't completed onboarding
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
