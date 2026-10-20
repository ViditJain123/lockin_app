import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
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

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Conversion rate options
type ConversionRate = '6:1' | '4:1' | '3:1';

interface ConversionOption {
  rate: ConversionRate;
  title: string;
  description: string;
  example: string;
}

const CONVERSION_OPTIONS: ConversionOption[] = [
  {
    rate: '6:1',
    title: 'Focused',
    description: '6 minutes work = 1 minute screen time',
    example: '1 hour timelapse = 10 min screen time',
  },
  {
    rate: '4:1',
    title: 'Balanced',
    description: '4 minutes work = 1 minute screen time',
    example: '1 hour timelapse = 15 min screen time',
  },
  {
    rate: '3:1',
    title: 'Relaxed',
    description: '3 minutes work = 1 minute screen time',
    example: '1 hour timelapse = 20 min screen time',
  },
];

interface ConversionRateQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  conversionRate: ConversionRate;
  onConversionRateChange: (rate: ConversionRate) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * ConversionRateQuestionScreen - Lets users choose how much screen time they earn per timelapse
 */
export default function ConversionRateQuestionScreen({
  currentStep,
  totalSteps,
  conversionRate,
  onConversionRateChange,
  onContinue,
  onBack,
}: ConversionRateQuestionScreenProps) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.subtitle}>Almost there!</Text>
          <Text style={styles.title}>
            How much screen time do you want to earn?
          </Text>
          <Text style={styles.description}>
            You'll earn screen time by recording productive timelapses. Choose your conversion rate:
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {CONVERSION_OPTIONS.map((option) => {
            const isSelected = conversionRate === option.rate;
            return (
              <Pressable
                key={option.rate}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => onConversionRateChange(option.rate)}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleSelected,
                    ]}>
                      {option.title}
                    </Text>
                    <View style={[
                      styles.rateBadge,
                      isSelected && styles.rateBadgeSelected,
                    ]}>
                      <Text style={[
                        styles.rateBadgeText,
                        isSelected && styles.rateBadgeTextSelected,
                      ]}>
                        {option.rate}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
                <Text style={styles.optionExample}>
                  {option.example}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

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
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    lineHeight: 34,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255,102,0, 0.15)',
    borderColor: '#FF6600',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
  },
  optionTitleSelected: {
    color: '#FF6600',
  },
  rateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rateBadgeSelected: {
    backgroundColor: 'rgba(255,102,0, 0.3)',
  },
  rateBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.secondary,
  },
  rateBadgeTextSelected: {
    color: '#FF6600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FF6600',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6600',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    marginBottom: 4,
  },
  optionExample: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});
