import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';
import CrystalImage from './CrystalImage';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { CrystalDefinition, TIER_COLORS, TIER_LABELS } from '@/constants/Crystals';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

interface CrystalReceivedModalProps {
  visible: boolean;
  crystal: CrystalDefinition | null;
  onClose: () => void;
  onAddToCollection: () => void;
}

function getCelebrationLine(crystal: CrystalDefinition, name: string): string {
  const displayName = name?.trim() || 'Champ';
  switch (crystal.tier) {
    case 'mythic':
      return `${crystal.name.toUpperCase()}.\nThis is legendary, ${displayName}.`;
    case 'epic':
      return `An ${crystal.name} for you, ${displayName}.\nRare ground.`;
    case 'rare':
      return `${crystal.name} unlocked!\nKeep grinding, ${displayName}.`;
    case 'uncommon':
      return `${crystal.name}, ${displayName}.\nMomentum compounding.`;
    default:
      return `${crystal.name} earned!\nFirst of many, ${displayName}.`;
  }
}

export default function CrystalReceivedModal({
  visible,
  crystal,
  onClose,
  onAddToCollection,
}: CrystalReceivedModalProps) {
  const insets = useSafeAreaInsets();
  const name = useOnboardingStore((s) => s.quizAnswers.name);

  if (!crystal) return null;

  const tierColor = TIER_COLORS[crystal.tier];
  const tierLabel = TIER_LABELS[crystal.tier];

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#000000']}
          style={StyleSheet.absoluteFill}
        />
        {/* Tier-tinted ambient glow */}
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            { backgroundColor: tierColor, opacity: crystal.tier === 'mythic' ? 0.18 : 0.08 },
          ]}
        />

        <Pressable
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={LC.text} />
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.tierLabel, { color: tierColor }]}>◆ {tierLabel} CRYSTAL</Text>

          <View style={styles.crystalWrap}>
            <View
              style={[
                styles.crystalGlow,
                {
                  backgroundColor: tierColor,
                  width: SCREEN_WIDTH * 0.7,
                  height: SCREEN_WIDTH * 0.7,
                  borderRadius: SCREEN_WIDTH * 0.35,
                },
              ]}
            />
            <CrystalImage crystalId={crystal.id} size={SCREEN_WIDTH * 0.55} />
          </View>

          <Text style={styles.celebrationText}>{getCelebrationLine(crystal, name)}</Text>
          <Text style={styles.lore}>{crystal.lore}</Text>
          <Text style={styles.levelMeta}>EARNED AT LV {crystal.milestoneLevel}</Text>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 36 }]}>
            <Button3D
              title="Add to collection"
              onPress={onAddToCollection}
              variant="purple"
              icon={<Ionicons name="diamond" size={20} color="white" />}
              iconPosition="left"
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
    backgroundColor: '#000',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    transform: [{ translateX: -SCREEN_WIDTH * 0.6 }],
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  tierLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 12,
  },
  crystalWrap: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  crystalGlow: {
    position: 'absolute',
    opacity: 0.22,
  },
  celebrationText: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: LC.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  lore: {
    fontFamily: Fonts.interRegular,
    fontSize: 15,
    color: LC.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  levelMeta: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: LC.textMute,
    letterSpacing: 2,
    marginBottom: 30,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
  },
});
