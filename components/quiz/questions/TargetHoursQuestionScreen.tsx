import Slider from '@react-native-community/slider';
import React, { useRef } from 'react';
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

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { sliderTick } from '../../../lib/haptics';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Slider configuration
const MIN_HOURS = 1;
const MAX_HOURS = 12;

// Pink color for the slider and text (brand color)
const SLIDER_COLOR = '#FF3B5C';

interface TargetHoursQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  targetHours: number;
  onTargetHoursChange: (hours: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * TargetHoursQuestionScreen - Asks user for their daily work/grind target hours
 */
export default function TargetHoursQuestionScreen({
  currentStep,
  totalSteps,
  userName,
  targetHours,
  onTargetHoursChange,
  onContinue,
  onBack,
}: TargetHoursQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const previousTargetHours = useRef(targetHours);

  const handleTargetHoursChange = (value: number) => {
    const roundedValue = Math.round(value);
    if (roundedValue !== previousTargetHours.current) {
      sliderTick();
      previousTargetHours.current = roundedValue;
    }
    onTargetHoursChange(roundedValue);
  };

  // Calculate font size based on slider value (scales from 48 to 80)
  const minFontSize = 48;
  const maxFontSize = 80;
  const progress = (targetHours - MIN_HOURS) / (MAX_HOURS - MIN_HOURS);
  const fontSize = minFontSize + progress * (maxFontSize - minFontSize);

  // Format the display text
  const displayText = targetHours >= MAX_HOURS ? `${targetHours}h+` : `${targetHours}h`;

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

        {/* Question content - fixed at top */}
        <View style={styles.questionContainer}>
          <Text style={styles.subtitle}>
            One last thing{userName ? `, ${userName}` : ''}.
          </Text>
          <Text style={styles.title}>
            How many hours do you want to grind every day?
          </Text>
        </View>

        {/* Spacer to push content down */}
        <View style={styles.topSpacer} />

        {/* Hours display - fixed height container, text grows upward */}
        <View style={styles.hoursContainer}>
          <Text style={[styles.hoursText, { fontSize }]}>
            {displayText}
          </Text>
        </View>

        {/* Slider - fixed position */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={MIN_HOURS}
            maximumValue={MAX_HOURS}
            step={1}
            value={targetHours}
            onValueChange={handleTargetHoursChange}
            minimumTrackTintColor={SLIDER_COLOR}
            maximumTrackTintColor={BrandColors.input.background}
            thumbTintColor="#FFFFFF"
          />
        </View>

        {/* Bottom spacer - fixed */}
        <View style={styles.bottomSpacer} />

        {/* Continue button - fixed at bottom */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
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
  topSpacer: {
    flex: 1,
  },
  hoursContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  hoursText: {
    fontFamily: Fonts.bold,
    color: SLIDER_COLOR,
  },
  sliderContainer: {
    paddingHorizontal: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bottomSpacer: {
    flex: 1.5,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});
