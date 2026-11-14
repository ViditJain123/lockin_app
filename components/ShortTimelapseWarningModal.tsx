import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';

import { Fonts } from '@/constants/Fonts';
import { T, cardShadow } from '@/constants/Theme';
import { useShortTimelapseWarningStore } from '@/store/useShortTimelapseWarningStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={T.ink} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Warning icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={72} color={T.orange} />
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
              color={checked ? T.orange : T.inkMute}
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
              variant="orange"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: T.canvas,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.card,
    borderRadius: 22,
    ...cardShadow,
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
    backgroundColor: T.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: T.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: T.inkSoft,
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
    color: T.inkSoft,
  },
  buttonContainer: {
    width: '100%',
  },
});
