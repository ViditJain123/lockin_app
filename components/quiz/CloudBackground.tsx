import React from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { BrandColors } from '../../constants/BrandColors';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

interface CloudBackgroundProps {
  height?: number;
}

/**
 * CloudBackground - Decorative red/pink aurora-like clouds for the top of quiz screens
 * Creates large elliptical shapes that appear to extend from outside the screen
 * Similar to the reference design with cloud shapes at the top corners
 */
export default function CloudBackground({ height = 250 }: CloudBackgroundProps) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      {/* SVG Cloud shapes - large ellipses extending from outside */}
      <Svg
        width={SCREEN_WIDTH}
        height={height}
        style={styles.svg}
        viewBox={`0 0 ${SCREEN_WIDTH} ${height}`}
      >
        <Defs>
          {/* Left cloud gradient - positioned off-screen left */}
          <RadialGradient id="leftCloudGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={BrandColors.primary.main} stopOpacity={0.5} />
            <Stop offset="40%" stopColor={BrandColors.primary.gradientEnd} stopOpacity={0.3} />
            <Stop offset="70%" stopColor={BrandColors.primary.dark} stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>

          {/* Right cloud gradient - positioned off-screen right */}
          <RadialGradient id="rightCloudGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={BrandColors.primary.gradientStart} stopOpacity={0.45} />
            <Stop offset="35%" stopColor={BrandColors.primary.main} stopOpacity={0.25} />
            <Stop offset="65%" stopColor={BrandColors.primary.gradientEnd} stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>

          {/* Center subtle glow */}
          <RadialGradient id="centerGlow" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor={BrandColors.primary.main} stopOpacity={0.2} />
            <Stop offset="50%" stopColor={BrandColors.primary.dark} stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Left cloud - large ellipse with center off-screen to the left and above */}
        <Ellipse
          cx={-SCREEN_WIDTH * 0.15}
          cy={-height * 0.3}
          rx={SCREEN_WIDTH * 0.7}
          ry={height * 1.2}
          fill="url(#leftCloudGrad)"
        />

        {/* Right cloud - large ellipse with center off-screen to the right and above */}
        <Ellipse
          cx={SCREEN_WIDTH * 1.15}
          cy={-height * 0.2}
          rx={SCREEN_WIDTH * 0.65}
          ry={height * 1.1}
          fill="url(#rightCloudGrad)"
        />

        {/* Subtle center top glow */}
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={-height * 0.5}
          rx={SCREEN_WIDTH * 0.8}
          ry={height * 0.9}
          fill="url(#centerGlow)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'visible',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
