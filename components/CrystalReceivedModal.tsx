import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';
import CrystalImage from './CrystalImage';

import { Fonts } from '@/constants/Fonts';
import { CrystalDefinition, TIER_COLORS, TIER_LABELS } from '@/constants/Crystals';
import { RADIUS, T, cardShadow } from '@/constants/Theme';
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
        <StatusBar style="light" />
        {/* Tier-tinted ambient glow */}
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            { backgroundColor: crystal.tier === 'mythic' ? T.orange : tierColor, opacity: 0.08 },
          ]}
        />

        <Pressable
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={T.ink} />
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.tierLabel, { color: tierColor }]}>{tierLabel} TROPHY</Text>

          <View style={styles.crystalWrap}>
            <View
              style={[
                styles.crystalGlow,
                {
                  backgroundColor: crystal.tier === 'mythic' ? T.orange : tierColor,
                  width: SCREEN_WIDTH * 0.7,
                  height: SCREEN_WIDTH * 0.7,
                  borderRadius: SCREEN_WIDTH * 0.35,
                },
              ]}
            />
            <View style={styles.trophyCard}>
              <CrystalImage crystalId={crystal.id} size={SCREEN_WIDTH * 0.48} />
            </View>
          </View>

          <Text style={styles.celebrationText}>{getCelebrationLine(crystal, name)}</Text>
          <Text style={styles.lore}>{crystal.lore}</Text>
          <Text style={styles.levelMeta}>EARNED AT LV {crystal.milestoneLevel}</Text>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 36 }]}>
            <Button3D
              title="Add to collection"
              onPress={onAddToCollection}
              variant="orange"
              icon={<Ionicons name="trophy" size={20} color="white" />}
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
    backgroundColor: T.canvas,
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
    backgroundColor: T.card,
    ...cardShadow,
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
    opacity: 0.12,
  },
  trophyCard: {
    padding: 18,
    borderRadius: RADIUS.xl,
    backgroundColor: T.card,
    ...cardShadow,
  },
  celebrationText: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: T.ink,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  lore: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: T.inkSoft,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  levelMeta: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: T.inkMute,
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
