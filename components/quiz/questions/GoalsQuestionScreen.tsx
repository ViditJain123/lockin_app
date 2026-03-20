import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';
import QuizOptionButton from '../QuizOptionButton';
import QuizProgressBar from '../QuizProgressBar';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const flagImage = require('../../../assets/images/flag-onboarding-2.png');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Goal options with emojis
const GOAL_OPTIONS = [
  { id: 'screen_time', label: 'Reduce Screen Time', icon: '📱' },
  { id: 'late_night', label: 'Quit late-night / early-morning scrolling', icon: '🌙' },
  { id: 'consistency', label: 'Build consistency & self-control', icon: '💪' },
  { id: 'study', label: 'Better focus for study', icon: '📚' },
  { id: 'work', label: 'Improved productivity at work', icon: '💼' },
  { id: 'present', label: 'Be more present', icon: '🧘' },
  { id: 'social', label: 'Less social isolation', icon: '👥' },
];

const MAX_SELECTIONS = 3;

interface GoalsQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * GoalsQuestionScreen - Second question in the quiz funnel
 * Asks user to select up to 3 goals they want to achieve
 */
export default function GoalsQuestionScreen({
  currentStep,
  totalSteps,
  userName,
  selectedGoals,
  onGoalsChange,
  onContinue,
  onBack,
}: GoalsQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const canContinue = selectedGoals.length > 0;

  const handleOptionPress = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      // Remove if already selected
      onGoalsChange(selectedGoals.filter((id) => id !== goalId));
    } else if (selectedGoals.length < MAX_SELECTIONS) {
      // Add if under limit
      onGoalsChange([...selectedGoals, goalId]);
    } else {
      // At max limit: replace last selected with new selection
      onGoalsChange([...selectedGoals.slice(0, -1), goalId]);
    }
  };

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Progress bar with back button */}
        <QuizProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          showBackButton={true}
        />

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question content */}
          <View style={styles.questionContainer}>
            <Text style={styles.subtitle}>
              So, tell us{userName ? `, ${userName}` : ''}.
            </Text>
            <Text style={styles.title}>
              What goals do you want to achieve using LockIn?
            </Text>
            <Text style={styles.hint}>Choose up to {MAX_SELECTIONS}</Text>
          </View>

          {/* Flag image */}
          <View style={styles.imageContainer}>
            <Image
              source={flagImage}
              style={styles.flagImage}
              resizeMode="contain"
            />
          </View>

          {/* Options list */}
          <View style={styles.optionsContainer}>
            {GOAL_OPTIONS.map((option) => (
              <QuizOptionButton
                key={option.id}
                label={option.label}
                icon={option.icon}
                selected={selectedGoals.includes(option.id)}
                onPress={() => handleOptionPress(option.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Continue button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 32 }]}>
          <Button3D
            title="Continue"
            onPress={onContinue}
            disabled={!canContinue}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 22,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    lineHeight: 34,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    marginTop: 8,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  flagImage: {
    width: 120,
    height: 120,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
