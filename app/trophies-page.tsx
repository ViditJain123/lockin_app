import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeRoadmap from '../components/BadgeRoadmap';
import CategoryTabs from '../components/CategoryTabs';
import TrophyReceivedModal from '../components/TrophyReceivedModal';
import { BadgeCategory, BadgeDefinition } from '../constants/Badges';
import { Fonts } from '../constants/Fonts';
import { useBadgeStore } from '../store/useBadgeStore';
import { useProfileStore } from '../store/useProfileStore';

export default function TrophiesPageScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('hours');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { hasBadge, claimBadge } = useBadgeStore();
  const totalHours = useProfileStore((s) => s.totalHours);
  const totalGrinds = useProfileStore((s) => s.totalGrinds);
  const currentStreak = useProfileStore((s) => s.currentStreak);

  const getCurrentProgress = (category: BadgeCategory) => {
    switch (category) {
      case 'hours':
        return totalHours;
      case 'grinds':
        return totalGrinds;
      case 'streak':
        return currentStreak;
      default:
        return 0;
    }
  };

  const handleBadgePress = useCallback((badge: BadgeDefinition) => {
    const isUnlocked = hasBadge(badge.id);
    const currentProgress = getCurrentProgress(badge.category);
    const isClaimable = !isUnlocked && currentProgress >= badge.threshold;

    // If claimable, claim it first
    if (isClaimable) {
      claimBadge(badge.id);
    }

    setSelectedBadge(badge);
    setShowModal(true);
  }, [hasBadge, claimBadge, totalHours, totalGrinds, currentStreak]);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBadge(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medals</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Tabs */}
      <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Badge Roadmap */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BadgeRoadmap category={selectedCategory} onBadgePress={handleBadgePress} />
      </ScrollView>

      {/* Trophy Modal */}
      <TrophyReceivedModal
        visible={showModal}
        badge={selectedBadge}
        onClose={handleCloseModal}
        onAddToCollection={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
