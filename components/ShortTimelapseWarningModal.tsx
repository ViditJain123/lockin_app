import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';

import { Fonts } from '@/constants/Fonts';
import { useShortTimelapseWarningStore } from '@/store/useShortTimelapseWarningStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');

interface ShortTimelapseWarningModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShortTimelapseWarningModal({ visible, onClose }: ShortTimelapseWarningModalProps) {
  const insets = useSafeAreaInsets();
  const setDontShowAgain = useShortTimelapseWarningStore((s) => s.setDontShowAgain);
  const [checked, setChecked] = useState(false);

  const handleClose = () => {
    if (checked) {
      setDontShowAgain(true);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <ImageBackground
        source={nightSkyBackground}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Warning icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={80} color="#F59E0B" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Recording Too Short</Text>

          {/* Message */}
          <Text style={styles.message}>
            Timelapse must be at least 1 minute long. This recording was not saved.
          </Text>

          {/* Checkbox row */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={checked ? 'checkbox' : 'square-outline'}
              size={24}
              color={checked ? '#F59E0B' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={styles.checkboxLabel}>Don't show again</Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Got it button */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }]}>
            <Button3D
              title="Got it"
              onPress={handleClose}
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
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 22,
    zIndex: 10,
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContainer: {
    width: '100%',
  },
});
