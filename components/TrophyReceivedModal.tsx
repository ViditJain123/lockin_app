import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  Image,
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
import { useOnboardingStore } from '@/store/useOnboardingStore';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');
const trophyRibbon = require('../assets/images/trophy_ribbon.png');

const RIBBON_WIDTH = SCREEN_WIDTH;

function getCelebrationText(badge: BadgeDefinition, name: string): string {
  const displayName = name || 'Champ';
  switch (badge.category) {
    case 'grinds':
      return `Kudos on your\n${badge.title}, ${displayName}!`;
    case 'hours':
      return `${badge.title} reached!\nProud of you, ${displayName}!`;
    case 'streak':
      return `${badge.title}!\nYou're on fire, ${displayName}!`;
    default:
      return `You did it, ${displayName}!`;
  }
}

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
  const name = useOnboardingStore((s) => s.quizAnswers.name);

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
      <LinearGradient
        colors={['rgba(26, 10, 62, 0.85)', 'rgba(18, 6, 37, 0.9)', 'rgba(10, 0, 21, 0.95)']}
        style={styles.container}
      >
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

          {/* Ribbon + Badge */}
          <View style={styles.ribbonBadgeContainer}>
            <Image
              source={trophyRibbon}
              style={styles.ribbonImage}
              resizeMode="stretch"
            />
            <View style={styles.badgeOverlay}>
              <BadgeImage badgeId={badge.id} size={200} />
            </View>
          </View>

          {/* Dynamic celebration text */}
          <Text style={styles.celebrationText}>
            {getCelebrationText(badge, name)}
          </Text>

          {/* Badge description */}
          <Text style={styles.badgeDescription}>{badge.description}</Text>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Add to collection button */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }]}>
            <Button3D
              title="Add to collection"
              onPress={onAddToCollection}
              variant="purple"
              icon={<Ionicons name="trophy" size={20} color="white" />}
              iconPosition="left"
            />
          </View>
        </View>
      </LinearGradient>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  ribbonBadgeContainer: {
    width: RIBBON_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginHorizontal: -32,
  },
  ribbonImage: {
    width: RIBBON_WIDTH,
    height: RIBBON_WIDTH * (530 / 455),
  },
  badgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    fontSize: 32,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
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
