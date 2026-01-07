import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';
import QuizInput from '../QuizInput';
import QuizProgressBar from '../QuizProgressBar';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets - same background as onboarding
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NameQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  name: string;
  onNameChange: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * NameQuestionScreen - First question in the quiz funnel
 * Asks "What should we call you?" with a name input
 */
export default function NameQuestionScreen({
  currentStep,
  totalSteps,
  name,
  onNameChange,
  onContinue,
  onBack,
}: NameQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const isValidName = name.trim().length > 0;

  const handleContinue = () => {
    if (isValidName) {
      Keyboard.dismiss();
      onContinue();
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <Text style={styles.subtitle}>First things first.</Text>
              <Text style={styles.title}>What should we call you?</Text>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Input field */}
            <View style={styles.inputContainer}>
              <QuizInput
                value={name}
                onChangeText={onNameChange}
                placeholder="Name"
                autoFocus={true}
                onSubmitEditing={handleContinue}
              />
            </View>

            {/* More spacer for visual balance */}
            <View style={styles.spacerLarge} />

            {/* Continue button */}
            <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 32 }]}>
              <Button3D
                title="Continue"
                onPress={handleContinue}
                disabled={!isValidName}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 22,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    lineHeight: 34,
  },
  spacer: {
    flex: 0.5,
  },
  spacerLarge: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});
