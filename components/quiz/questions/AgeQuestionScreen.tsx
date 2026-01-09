import { Ionicons } from '@expo/vector-icons';
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
const ageImage = require('../../../assets/images/age.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Cyan color matching the reference image icons
const ICON_COLOR = '#00CED1';

// Age options with icons
const AGE_OPTIONS = [
  { id: 'under_18', label: 'Under 18', iconName: 'person' as const },
  { id: '18_24', label: '18-24', iconName: 'accessibility' as const },
  { id: '25_29', label: '25-29', iconName: 'person' as const },
  { id: '30_40', label: '30-40', iconName: 'accessibility' as const },
  { id: '40_plus', label: '40 and over', iconName: 'person' as const },
];

interface AgeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  selectedAge: string;
  onAgeChange: (age: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * AgeQuestionScreen - Age selection screen in the quiz funnel
 * Asks user their age range (single selection)
 */
export default function AgeQuestionScreen({
  currentStep,
  totalSteps,
  selectedAge,
  onAgeChange,
  onContinue,
  onBack,
}: AgeQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const canContinue = selectedAge.length > 0;

  const handleOptionPress = (ageId: string) => {
    // Single selection - just set the new age
    onAgeChange(ageId);
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
              This helps us adjust Pushscroll to help you achieve your goals easier.
            </Text>
            <Text style={styles.title}>
              How old are you?
            </Text>
            <Text style={styles.hint}>Choose one</Text>
          </View>

          {/* Age image */}
          <View style={styles.imageContainer}>
            <Image
              source={ageImage}
              style={styles.ageImage}
              resizeMode="contain"
            />
          </View>

          {/* Options list */}
          <View style={styles.optionsContainer}>
            {AGE_OPTIONS.map((option) => (
              <QuizOptionButton
                key={option.id}
                label={option.label}
                iconComponent={<Ionicons name={option.iconName} size={20} color={ICON_COLOR} />}
                selected={selectedAge === option.id}
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
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginBottom: 8,
    lineHeight: 24,
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
  ageImage: {
    width: 100,
    height: 100,
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
