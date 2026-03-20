import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { TOTAL_QUIZ_QUESTIONS } from '../../../store/useOnboardingStore';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

interface HowItWorksScreenProps {
  userName: string;
  targetHours: number;
  onContinue: () => void;
  onBack: () => void;
}

interface StepCardProps {
  stepNumber: number;
  iconName: string;
  iconFamily: 'ionicons' | 'material-community';
  title: string;
  description: string;
}

function StepCard({ stepNumber, iconName, iconFamily, title, description }: StepCardProps) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepNumberBadge}>
        <Text style={styles.stepNumberText}>{stepNumber}</Text>
      </View>
      <View style={styles.stepIconContainer}>
        {iconFamily === 'ionicons' ? (
          <Ionicons name={iconName as any} size={28} color="#FF3B5C" />
        ) : (
          <MaterialCommunityIcons name={iconName as any} size={28} color="#FF3B5C" />
        )}
      </View>
      <View style={styles.stepTextContainer}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function HowItWorksScreen({
  userName,
  targetHours,
  onContinue,
  onBack,
}: HowItWorksScreenProps) {
  const insets = useSafeAreaInsets();
  const displayName = userName || 'there';

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Progress bar with back button */}
        <QuizProgressBar
          currentStep={19}
          totalSteps={TOTAL_QUIZ_QUESTIONS}
          onBack={onBack}
          showBackButton={true}
        />

        {/* Title section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Here's how it works</Text>
          <Text style={styles.subtitle}>
            {displayName}, you chose to work {targetHours} hours daily
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <StepCard
            stepNumber={1}
            iconName="videocam"
            iconFamily="ionicons"
            title="Record"
            description="Record a timelapse while you work"
          />
          <StepCard
            stepNumber={2}
            iconName="timer-outline"
            iconFamily="material-community"
            title="Earn"
            description="Earn 15 min of screen time per hour"
          />
          <StepCard
            stepNumber={3}
            iconName="lock-open-outline"
            iconFamily="ionicons"
            title="Unlock"
            description={`Hit ${targetHours}hrs → phone fully unlocked`}
          />
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={BrandColors.text.secondary} />
          <Text style={styles.infoText}>
            You'll earn breaks as you go. Once you hit your daily target, your phone unlocks completely for the rest of the day.
          </Text>
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
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 22,
  },
  stepsContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 59, 92, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: '#FF3B5C',
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 92, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});
