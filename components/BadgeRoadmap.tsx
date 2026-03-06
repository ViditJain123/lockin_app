import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import BadgeRoadmapItem from './BadgeRoadmapItem';

import { BadgeCategory, BadgeDefinition, BADGES_BY_CATEGORY } from '@/constants/Badges';
import { useBadgeStore } from '@/store/useBadgeStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PATH_WIDTH = SCREEN_WIDTH - 32;
const ITEM_HEIGHT = 140;

interface BadgeRoadmapProps {
  category: BadgeCategory;
  onBadgePress?: (badge: BadgeDefinition) => void;
}

function BadgeRoadmap({ category, onBadgePress }: BadgeRoadmapProps) {
  const hasBadge = useBadgeStore((s) => s.hasBadge);
  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const totalGrinds = useProfileStatsStore((s) => s.grinds);
  const currentStreak = useProfileStatsStore((s) => s.streak);

  const badges = BADGES_BY_CATEGORY[category];

  // Get current progress based on category
  const getCurrentProgress = () => {
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

  const currentProgress = getCurrentProgress();

  // Memoize SVG path generation - only recalculate when category changes
  const pathData = useMemo(() => {
    const pathPoints: string[] = [];
    const centerX = PATH_WIDTH / 2;
    const amplitude = PATH_WIDTH * 0.25; // How far the path swings left/right
    const startY = 40;

    // Starting point
    pathPoints.push(`M ${centerX} ${startY}`);

    // Create curves between each badge
    badges.forEach((_, index) => {
      const y = startY + (index + 1) * ITEM_HEIGHT;
      const prevY = startY + index * ITEM_HEIGHT;
      const midY = (y + prevY) / 2;

      // Alternate between left and right
      const direction = index % 2 === 0 ? 1 : -1;
      const controlX = centerX + amplitude * direction;

      // Quadratic bezier curve
      pathPoints.push(`Q ${controlX} ${midY} ${centerX} ${y}`);
    });

    return pathPoints.join(' ');
  }, [category, badges]);

  return (
    <View style={styles.container}>
      {/* Path SVG */}
      <View style={styles.pathContainer}>
        <Svg
          width={PATH_WIDTH}
          height={badges.length * ITEM_HEIGHT + 80}
          style={styles.svg}
        >
          {/* Background path (unfilled) */}
          <Path
            d={pathData}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress path (filled up to current progress) */}
          <Path
            d={pathData}
            stroke="#FF3B5C"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(currentProgress / (badges[badges.length - 1]?.threshold || 1)) * (badges.length * ITEM_HEIGHT)} 10000`}
          />
        </Svg>
      </View>

      {/* Badge items */}
      <View style={styles.badgesContainer}>
        {badges.map((badge, index) => {
          const isUnlocked = hasBadge(badge.id);
          const isClaimable = !isUnlocked && currentProgress >= badge.threshold;

          return (
            <View
              key={badge.id}
              style={[
                styles.badgeItemWrapper,
                { height: ITEM_HEIGHT },
              ]}
            >
              <BadgeRoadmapItem
                badge={badge}
                isUnlocked={isUnlocked}
                isClaimable={isClaimable}
                isLeft={index % 2 === 0}
                currentProgress={currentProgress}
                onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  pathContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  badgesContainer: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  badgeItemWrapper: {
    justifyContent: 'center',
  },
});

export default memo(BadgeRoadmap);
