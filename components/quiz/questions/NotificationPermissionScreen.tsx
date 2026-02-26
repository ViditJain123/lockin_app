import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { requestNotificationPermission } from '../../../lib/notificationService';

const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotificationPermissionScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function NotificationPermissionScreen({
  onContinue,
  onBack,
}: NotificationPermissionScreenProps) {
  const insets = useSafeAreaInsets();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleContinue = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
    } catch (error) {
      console.error('[NotificationPermission] Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
      onContinue();
    }
  };

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Back button */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={BrandColors.text.primary}
            />
          </Pressable>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Bell icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={64} color={BrandColors.text.accent} />
          </View>

          <Text style={styles.title}>
            Stay on Track with{'\n'}Reminders
          </Text>

          <Text style={styles.subtitle}>
            Get daily reminders to lock in, keep your{'\n'}streak alive, and celebrate your wins.
          </Text>

          {/* Feature list */}
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="alarm-outline" size={22} color={BrandColors.text.secondary} />
              <Text style={styles.featureText}>Daily focus reminders</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="flame-outline" size={22} color={BrandColors.text.secondary} />
              <Text style={styles.featureText}>Streak motivation</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="trophy-outline" size={22} color={BrandColors.text.secondary} />
              <Text style={styles.featureText}>Achievement updates</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            You can change notification settings{'\n'}at any time in the app.
          </Text>
        </View>

        {/* Continue button */}
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Button3D
            title="Continue"
            onPress={handleContinue}
            disabled={isRequesting}
            loading={isRequesting}
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
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    gap: 16,
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 22,
  },
  footerContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
