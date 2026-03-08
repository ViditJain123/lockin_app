import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Fonts } from '../constants/Fonts';

const BRAND_PINK = '#FF3B5C';

interface FocusRingProps {
  currentHours: number;
  targetHours: number;
  size?: number;
}

export default function FocusRing({ currentHours, targetHours, size: sizeProp }: FocusRingProps) {
  // Calculate progress (0 to 1)
  const progress = Math.min(currentHours / targetHours, 1);
  const isComplete = progress >= 1;

  // Ring dimensions
  const size = sizeProp || 100;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Format display
  const displayCurrent = currentHours < 1
    ? Math.round(currentHours * 60) + 'm'
    : Math.round(currentHours) + 'h';
  const displayTarget = targetHours + ' hours';

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Focus Ring</Text>

      {/* Content row */}
      <View style={styles.contentRow}>
        {/* Ring */}
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 59, 92, 0.2)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={BRAND_PINK}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          {/* Indicator: checkmark when complete, arrow when in progress */}
          {isComplete ? (
            <View style={styles.checkmarkContainer}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmarkText}>{'✓'}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.arrowIndicator, {
              transform: [
                { translateX: -12 },
                { translateY: -12 },
                { rotate: `${progress * 360 - 90}deg` },
                { translateX: radius },
              ]
            }]}>
              <View style={styles.arrowCircle}>
                <Text style={[styles.arrowText, { transform: [{ rotate: '90deg' }] }]}>{'→'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Grind hours</Text>
          <Text style={styles.statsValue}>
            <Text style={styles.currentValue}>{displayCurrent}</Text>
            <Text style={styles.targetValue}>/{displayTarget}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: 'white',
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  arrowIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: 'black',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  statsContainer: {
    marginLeft: 24,
    flex: 1,
  },
  statsLabel: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  currentValue: {
    color: BRAND_PINK,
  },
  targetValue: {
    color: BRAND_PINK,
  },
});
