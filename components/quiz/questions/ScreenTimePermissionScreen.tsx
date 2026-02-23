import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenTimePermissionScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * ScreenTimePermissionScreen - Requests Screen Time / Family Controls permission
 * Shows a preview of the permission dialog and triggers the actual iOS permission request
 */
export default function ScreenTimePermissionScreen({
  onContinue,
  onBack,
}: ScreenTimePermissionScreenProps) {
  const insets = useSafeAreaInsets();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleContinue = async () => {
    setIsRequesting(true);
    try {
      // Request authorization - this triggers the iOS system dialog
      await ReactNativeDeviceActivity.requestAuthorization('individual');
      console.log('Authorization requested, waiting for user response...');

      // Poll for authorization status change (waits for user to respond to dialog)
      // Polls every 250ms for up to 10 attempts (2.5 seconds total)
      const status = await ReactNativeDeviceActivity.pollAuthorizationStatus();
      console.log('Authorization status:', status);

      if (status === ReactNativeDeviceActivity.AuthorizationStatus.approved) {
        console.log('Authorization approved, proceeding');
        onContinue();
      } else if (status === ReactNativeDeviceActivity.AuthorizationStatus.denied) {
        console.log('Authorization denied');
        // Still allow continuing but user won't be able to select apps
        onContinue();
      } else {
        // Still notDetermined after polling - user may have dismissed without choosing
        console.log('Authorization still pending');
        onContinue();
      }
    } catch (error) {
      console.error('Authorization error:', error);
      // Graceful fallback - still allow continuing
      onContinue();
    } finally {
      setIsRequesting(false);
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
        {/* Custom header - back button only */}
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
          {/* Title */}
          <Text style={styles.title}>
            Connect LockIn to{'\n'}Screen Time, Securely.
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            To analyze your Screen Time on this iPhone,{'\n'}LockIn will need your permission
          </Text>

          {/* Permission Dialog Preview Card */}
          <View style={styles.dialogCard}>
            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
              {/* Play button indicator */}
              <View style={styles.playButtonContainer}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                </View>
              </View>

              {/* Dialog content */}
              <Text style={styles.dialogTitle}>
                "LockIn" Would Like to{'\n'}Access Screen Time
              </Text>
              <Text style={styles.dialogBody}>
                Providing "LockIn" access to Screen Time{'\n'}lets it see your activity data, app content,{'\n'}and limit the usage of apps and websites.
              </Text>

              {/* Mock buttons */}
              <View style={styles.dialogButtons}>
                <View style={styles.dialogButton}>
                  <Text style={styles.dialogButtonText}>Continue</Text>
                </View>
                <View style={[styles.dialogButton, styles.dialogButtonSecondary]}>
                  <Text style={styles.dialogButtonTextSecondary}>Don't Allow</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Upward arrow indicator */}
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-up" size={32} color={BrandColors.text.primary} />
          </View>
        </View>

        {/* Privacy footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Your sensitive data is protected by{'\n'}Apple and never leaves your device.
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
    marginBottom: 24,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurContainer: {
    padding: 20,
    alignItems: 'center',
  },
  playButtonContainer: {
    marginBottom: 16,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dialogTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  dialogBody: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogButtons: {
    width: '100%',
    gap: 8,
  },
  dialogButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dialogButtonText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  dialogButtonTextSecondary: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: BrandColors.text.primary,
  },
  arrowContainer: {
    marginTop: 20,
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
