import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { buttonPress } from '@/lib/haptics';

import { formatHM } from './TodayCard';

// 3D brain render (generated in Canva), cut out onto a transparent background.
// Swap assets/images/brain.png for a higher-res version any time; the aspect
// ratio is read from the file, so nothing else needs to change.
const BRAIN_IMAGE = require('../../assets/images/brain.png');
const BRAIN_SRC = Image.resolveAssetSource(BRAIN_IMAGE);
const BRAIN_ASPECT = BRAIN_SRC.width / BRAIN_SRC.height;
const BRAIN_W = 190;
const HALO = 330;


function GlassStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <BlurView intensity={28} tint="dark" style={styles.glass}>
      <Text style={styles.glassLabel}>{label}</Text>
      <Text style={[styles.glassValue, accent ? { color: accent } : null]}>{value}</Text>
      {sub ? <Text style={styles.glassSub}>{sub}</Text> : null}
    </BlurView>
  );
}

interface Props {
  todayMinutes: number;
  targetHours: number;
  streak: number;
  onPress: () => void;
}

/**
 * Home hero: a glowing 3D brain that breathes, with today's focus floating
 * on glass cards over it. The brain "charges" brighter as you near the goal.
 */
export default function BrainHero({ todayMinutes, targetHours, streak, onPress }: Props) {
  const goal = targetHours * 60;
  const progress = goal > 0 ? Math.min(todayMinutes / goal, 1) : 0;
  const done = progress >= 1;

  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [breathe]);

  const brainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -breathe.value * 4 }, { scale: 1 + breathe.value * 0.03 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + progress * 0.25 + breathe.value * 0.15,
    transform: [{ scale: 0.92 + breathe.value * 0.08 }],
  }));

  return (
    <Pressable
      onPress={() => {
        buttonPress();
        onPress();
      }}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={`Today ${formatHM(todayMinutes)} of ${targetHours} hour goal. Open stats`}
    >
      {/* Bright backdrop: halo with a hot yellow core */}
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
        <Svg width={HALO} height={HALO}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="48%" r="50%">
              <Stop offset="0" stopColor="#FFD36B" stopOpacity={0.9} />
              <Stop offset="0.38" stopColor={T.orange} stopOpacity={0.5} />
              <Stop offset="0.68" stopColor={T.orange} stopOpacity={0.14} />
              <Stop offset="1" stopColor={T.orange} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill="url(#halo)" />
        </Svg>
      </Animated.View>

      <View style={styles.brain}>
        <Animated.View style={brainStyle}>
          <Image source={BRAIN_IMAGE} style={styles.brainImg} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </View>

      <View style={[styles.statLeft]}>
        <GlassStat
          label="TODAY"
          value={formatHM(todayMinutes)}
          sub={done ? 'Goal hit ✓' : `${formatHM(goal - todayMinutes)} to go`}
        />
      </View>
      <View style={styles.statRight}>
        <GlassStat label="GOAL" value={`${Math.round(progress * 100)}%`} sub={`of ${targetHours}h`} accent={done ? T.yellow : T.orange} />
      </View>
      <View style={styles.streak}>
        <Text style={styles.streakText}>🔥 {streak} {streak === 1 ? 'day' : 'days'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: (220 - HALO) / 2 - 6,
  },
  brain: {
    marginTop: -16,
  },
  brainImg: {
    width: BRAIN_W,
    height: BRAIN_W / BRAIN_ASPECT,
  },
  glass: {
    overflow: 'hidden',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(22,22,22,0.45)',
  },
  glassLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: T.inkMute,
  },
  glassValue: {
    marginTop: 2,
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: T.ink,
  },
  glassSub: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: T.inkSoft,
  },
  statLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  statRight: {
    position: 'absolute',
    right: 0,
    bottom: 26,
  },
  streak: {
    position: 'absolute',
    top: 10,
    right: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: T.yellow,
  },
  streakText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: T.black,
  },
});
