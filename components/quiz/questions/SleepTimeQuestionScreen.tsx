import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';
import QuizProgressBar from '../QuizProgressBar';
import TimePicker from '../TimePicker';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Brand color for accent
const SLEEP_ACCENT_COLOR = BrandColors.primary.main;

export interface SleepTime {
  hour: number; // 1-12
  minute: number; // 0, 15, 30, 45
  period: 'AM' | 'PM';
}

interface SleepTimeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  sleepTime: SleepTime;
  onSleepTimeChange: (sleepTime: SleepTime) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * SleepTimeQuestionScreen - Asks user what time they typically go to sleep
 * Features a modern wheel-style time picker with purple/sleep theme
 */
export default function SleepTimeQuestionScreen({
  currentStep,
  totalSteps,
  userName,
  sleepTime,
  onSleepTimeChange,
  onContinue,
  onBack,
}: SleepTimeQuestionScreenProps) {
  const insets = useSafeAreaInsets();

  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    onSleepTimeChange({ hour, minute, period });
  };

  // Format time for display
  const formatTimeDisplay = () => {
    const minuteStr = sleepTime.minute.toString().padStart(2, '0');
    return `${sleepTime.hour}:${minuteStr} ${sleepTime.period}`;
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

        {/* Question content */}
        <View style={styles.questionContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="moon" size={32} color={SLEEP_ACCENT_COLOR} />
          </View>
          <Text style={styles.subtitle}>
            Let's optimize your routine{userName ? `, ${userName}` : ''}.
          </Text>
          <Text style={styles.title}>
            What time do you usually go to sleep?
          </Text>
        </View>

        {/* Spacer */}
        <View style={styles.topSpacer} />

        {/* Time picker */}
        <View style={styles.pickerContainer}>
          <TimePicker
            hour={sleepTime.hour}
            minute={sleepTime.minute}
            period={sleepTime.period}
            onTimeChange={handleTimeChange}
            accentColor={SLEEP_ACCENT_COLOR}
          />
        </View>

        {/* Helper text */}
        <Text style={styles.helperText}>
          We'll use this to personalize your experience
        </Text>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />

        {/* Continue button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 32 }]}>
          <Button3D
            title="Continue"
            onPress={onContinue}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
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
  topSpacer: {
    flex: 0.5,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeDisplayLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: BrandColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 48,
    fontFamily: Fonts.bold,
  },
  pickerContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});
