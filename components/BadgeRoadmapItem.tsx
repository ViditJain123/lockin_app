import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import BadgeImage from './BadgeImage';

import { BadgeDefinition } from '@/constants/Badges';
import { Fonts } from '@/constants/Fonts';

interface BadgeRoadmapItemProps {
  badge: BadgeDefinition;
  isUnlocked: boolean;
  isClaimable: boolean;
  isLeft: boolean;
  currentProgress: number;
  onPress?: () => void;
}

function BadgeRoadmapItem({
  badge,
  isUnlocked,
  isClaimable,
  isLeft,
  currentProgress,
  onPress,
}: BadgeRoadmapItemProps) {
  // Shake animation for claimable badges
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isClaimable) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 50 }),
          withTiming(3, { duration: 100 }),
          withTiming(0, { duration: 50 })
        ),
        -1, // infinite
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isClaimable, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Calculate progress percentage towards this badge
  const progressPercent = Math.min((currentProgress / badge.threshold) * 100, 100);
  const showProgress = !isUnlocked && !isClaimable && progressPercent > 0;

  // Format the requirement text based on category
  const getRequirementText = () => {
    switch (badge.category) {
      case 'hours':
        return `Record ${badge.threshold} ${badge.threshold === 1 ? 'hour' : 'hours'}`;
      case 'grinds':
        return `Complete ${badge.threshold} ${badge.threshold === 1 ? 'session' : 'sessions'}`;
      case 'streak':
        return `${badge.threshold} day streak`;
      default:
        return badge.description;
    }
  };

  const content = (
    <>
      {/* Badge image */}
      <Animated.View style={[styles.badgeContainer, isClaimable && animatedStyle]}>
        <BadgeImage
          badgeId={badge.id}
          size={80}
          locked={!isUnlocked && !isClaimable}
        />
      </Animated.View>

      {/* Info section */}
      <View style={[styles.infoContainer, isLeft ? styles.infoLeft : styles.infoRight]}>
        <Text style={[styles.title, isUnlocked && styles.titleUnlocked]}>
          {badge.title}
        </Text>
        <Text style={styles.requirement}>{getRequirementText()}</Text>

        {/* Progress bar for locked badges */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(currentProgress)}/{badge.threshold}
            </Text>
          </View>
        )}

        {/* Completed indicator */}
        {isUnlocked && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Earned</Text>
          </View>
        )}

        {/* Claimable indicator */}
        {isClaimable && (
          <View style={styles.claimableBadge}>
            <Text style={styles.claimableText}>Tap to claim!</Text>
          </View>
        )}
      </View>
    </>
  );

  // Wrap in TouchableOpacity if unlocked or claimable and has onPress handler
  if ((isUnlocked || isClaimable) && onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, isLeft ? styles.containerLeft : styles.containerRight]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, isLeft ? styles.containerLeft : styles.containerRight]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  containerLeft: {
    flexDirection: 'row',
  },
  containerRight: {
    flexDirection: 'row-reverse',
  },
  badgeContainer: {
    marginHorizontal: 12,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  infoLeft: {
    alignItems: 'flex-start',
  },
  infoRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  titleUnlocked: {
    color: 'white',
  },
  requirement: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B5C',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.4)',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#4CAF50',
  },
  claimableBadge: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimableText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#FF3B5C',
  },
});

export default memo(BadgeRoadmapItem);
