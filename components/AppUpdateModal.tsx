import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';

import { Fonts } from '@/constants/Fonts';
import { useAppUpdateStore } from '@/store/useAppUpdateStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');

interface AppUpdateModalProps {
  visible: boolean;
}

export default function AppUpdateModal({ visible }: AppUpdateModalProps) {
  const insets = useSafeAreaInsets();
  const { updateMessage, latestVersion, currentVersion, openStore } = useAppUpdateStore();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        // Force update modal cannot be dismissed
      }}
    >
      <ImageBackground
        source={nightSkyBackground}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Update icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download" size={80} color="#FF3B5C" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Update Required</Text>

          {/* Message */}
          <Text style={styles.message}>
            {updateMessage || 'A critical update is required to continue using the app.'}
          </Text>

          {/* Version info */}
          <Text style={styles.versionText}>
            Current: v{currentVersion} → New: v{latestVersion}
          </Text>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Update button */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }]}>
            <Button3D
              title="Update Now"
              onPress={openStore}
              icon={<Ionicons name="arrow-forward" size={20} color="white" />}
              iconPosition="right"
            />
          </View>
        </View>
      </ImageBackground>
    </Modal>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  spacer: {
    flex: 1,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.interExtraBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
