import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import BadgeImage from './BadgeImage';

import { Fonts } from '@/constants/Fonts';
import { useBadgeStore } from '@/store/useBadgeStore';

const FEATURED_COUNT = 5;
const HORIZONTAL_PADDING = 20; // Padding on each side of the container

function FeaturedBadges() {
  const { width: screenWidth } = useWindowDimensions();
  const getRecentlyEarnedBadges = useBadgeStore((s) => s.getRecentlyEarnedBadges);
  const earnedBadges = useBadgeStore((s) => s.earnedBadges);

  // Calculate badge size dynamically based on screen width
  // Available width = screen width - (2 * padding) - (gaps between badges)
  const availableWidth = screenWidth - (2 * HORIZONTAL_PADDING);
  const gapBetweenBadges = 12;
  const totalGapWidth = (FEATURED_COUNT - 1) * gapBetweenBadges;
  const badgeSize = Math.floor((availableWidth - totalGapWidth) / FEATURED_COUNT);

  // Get the most recently earned badges
  const recentBadges = getRecentlyEarnedBadges(FEATURED_COUNT);

  // Create slots array (filled badges + empty placeholders)
  const slots = Array.from({ length: FEATURED_COUNT }, (_, i) => recentBadges[i] || null);

  const handleNavigateToTrophies = () => {
    router.push('/trophies-page');
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={handleNavigateToTrophies}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Badge Collection</Text>
        <View style={styles.viewAllContainer}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      </TouchableOpacity>

      {/* Badges row */}
      <TouchableOpacity
        style={styles.badgesRow}
        onPress={handleNavigateToTrophies}
        activeOpacity={0.8}
      >
        {slots.map((badge, index) => (
          <View
            key={badge?.id || `empty-${index}`}
            style={[styles.badgeSlot, { width: badgeSize, height: badgeSize }]}
          >
            {badge ? (
              <BadgeImage badgeId={badge.id} size={badgeSize} />
            ) : (
              <View
                style={[
                  styles.emptySlot,
                  {
                    width: badgeSize,
                    height: badgeSize,
                    borderRadius: badgeSize / 2,
                  },
                ]}
              >
                <Ionicons name="trophy-outline" size={badgeSize * 0.45} color="rgba(255,255,255,0.2)" />
              </View>
            )}
          </View>
        ))}

        {/* Show count if more than 3 badges */}
        {earnedBadges.length > FEATURED_COUNT && (
          <View style={styles.moreContainer}>
            <Text style={styles.moreText}>+{earnedBadges.length - FEATURED_COUNT}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderRadius: 12,
  },
  moreText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FF3B5C',
  },
});

export default memo(FeaturedBadges);
