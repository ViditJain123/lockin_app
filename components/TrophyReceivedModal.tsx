import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

import BadgeImage from './BadgeImage';
import Button3D from './Button3D';

import { BadgeDefinition } from '@/constants/Badges';
import { Fonts } from '@/constants/Fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');

interface TrophyReceivedModalProps {
  visible: boolean;
  badge: BadgeDefinition | null;
  onClose: () => void;
  onAddToCollection: () => void;
}

export default function TrophyReceivedModal({
  visible,
  badge,
  onClose,
  onAddToCollection,
}: TrophyReceivedModalProps) {
  const insets = useSafeAreaInsets();

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
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
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Badge image with glow */}
          <View style={styles.badgeContainer}>
            <BadgeImage badgeId={badge.id} size={200} showGlow />
          </View>

          {/* "You did it!" text */}
          <Text style={styles.celebrationText}>You did it!</Text>

          {/* Badge title */}
          <Text style={styles.badgeTitle}>{badge.title}</Text>

          {/* Badge description */}
          <Text style={styles.badgeDescription}>{badge.description}</Text>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Add to collection button */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }]}>
            <Button3D
              title="Add to collection"
              onPress={onAddToCollection}
              icon={<Ionicons name="trophy" size={20} color="white" />}
              iconPosition="left"
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
  badgeContainer: {
    marginBottom: 32,
  },
  celebrationText: {
    fontSize: 28,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeTitle: {
    fontSize: 36,
    fontFamily: Fonts.interExtraBold,
    color: '#FF3B5C',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  badgeDescription: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
