import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
const timerImage = require('../../../assets/images/timer-onboarding.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Icon size for app icons
const ICON_SIZE = 20;

// App options with brand icons
const APP_OPTIONS = [
  { id: 'tiktok', label: 'TikTok', iconType: 'fontawesome5', iconName: 'tiktok', iconColor: '#FFFFFF' },
  { id: 'youtube', label: 'YouTube', iconType: 'fontawesome5', iconName: 'youtube', iconColor: '#FF0000' },
  { id: 'instagram', label: 'Instagram', iconType: 'fontawesome5', iconName: 'instagram', iconColor: '#E4405F' },
  { id: 'mobile_games', label: 'Mobile Games', iconType: 'ionicons', iconName: 'game-controller', iconColor: '#9B59B6' },
  { id: 'twitter', label: 'Twitter (X)', iconType: 'fontawesome5', iconName: 'twitter', iconColor: '#1DA1F2' },
  { id: 'reddit', label: 'Reddit', iconType: 'fontawesome5', iconName: 'reddit-alien', iconColor: '#FF4500' },
  { id: 'discord', label: 'Discord', iconType: 'fontawesome5', iconName: 'discord', iconColor: '#5865F2' },
  { id: 'shopping', label: 'Online Shopping', iconType: 'materialcommunity', iconName: 'shopping', iconColor: '#F39C12' },
  { id: 'other', label: 'Other Apps', iconType: 'ionicons', iconName: 'apps', iconColor: '#95A5A6' },
] as const;

// Helper to render the appropriate icon
const renderIcon = (option: typeof APP_OPTIONS[number]) => {
  switch (option.iconType) {
    case 'fontawesome5':
      return <FontAwesome5 name={option.iconName} size={ICON_SIZE} color={option.iconColor} />;
    case 'ionicons':
      return <Ionicons name={option.iconName as any} size={ICON_SIZE} color={option.iconColor} />;
    case 'materialcommunity':
      return <MaterialCommunityIcons name={option.iconName as any} size={ICON_SIZE} color={option.iconColor} />;
    default:
      return null;
  }
};

const MAX_SELECTIONS = 3;

interface AppsQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  selectedApps: string[];
  onAppsChange: (apps: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * AppsQuestionScreen - Question in the quiz funnel
 * Asks user which apps are taking most of their time
 */
export default function AppsQuestionScreen({
  currentStep,
  totalSteps,
  selectedApps,
  onAppsChange,
  onContinue,
  onBack,
}: AppsQuestionScreenProps) {
  const insets = useSafeAreaInsets();
  const canContinue = selectedApps.length > 0;

  const handleOptionPress = (appId: string) => {
    if (selectedApps.includes(appId)) {
      // Remove if already selected
      onAppsChange(selectedApps.filter((id) => id !== appId));
    } else if (selectedApps.length < MAX_SELECTIONS) {
      // Add if under limit
      onAppsChange([...selectedApps, appId]);
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
              Now, let's find the cause.
            </Text>
            <Text style={styles.title}>
              Which apps are taking most of your time?
            </Text>
            <Text style={styles.hint}>Choose up to {MAX_SELECTIONS}</Text>
          </View>

          {/* Timer image */}
          <View style={styles.imageContainer}>
            <Image
              source={timerImage}
              style={styles.timerImage}
              resizeMode="contain"
            />
          </View>

          {/* Options list */}
          <View style={styles.optionsContainer}>
            {APP_OPTIONS.map((option) => (
              <QuizOptionButton
                key={option.id}
                label={option.label}
                iconComponent={renderIcon(option)}
                selected={selectedApps.includes(option.id)}
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
  timerImage: {
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
