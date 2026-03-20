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

// Orange color for the slider and text (matching reference)
const SLIDER_COLOR = '#F5A623';

interface ScreenTimeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  screenTime: number;
  onScreenTimeChange: (hours: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * ScreenTimeQuestionScreen - Third question in the quiz funnel
 * Asks user how much time they spend on their phone daily with a slider
 */
export default function ScreenTimeQuestionScreen({
  currentStep,
  totalSteps,
  screenTime,
  onScreenTimeChange,
  onContinue,
  onBack,
}: ScreenTimeQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const previousScreenTime = useRef(screenTime);

  const handleScreenTimeChange = (value: number) => {
    const roundedValue = Math.round(value);
    if (roundedValue !== previousScreenTime.current) {
      sliderTick();
      previousScreenTime.current = roundedValue;
    }
    onScreenTimeChange(roundedValue);
  };

  // Calculate font size based on slider value (scales from 48 to 80)
  // Max size is now smaller - equivalent to what 9 hours would have been before
  const minFontSize = 48;
  const maxFontSize = 80;
  const progress = (screenTime - MIN_HOURS) / (MAX_HOURS - MIN_HOURS);
  const fontSize = minFontSize + progress * (maxFontSize - minFontSize);

  // Format the display text
  const displayText = screenTime >= MAX_HOURS ? `${screenTime}h+` : `${screenTime}h`;

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
            Now let's understand your phone usage a bit more.
          </Text>
          <Text style={styles.title}>
            How much time do you spend on your phone every day?
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
            value={screenTime}
            onValueChange={handleScreenTimeChange}
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
