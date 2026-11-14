import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';

export const NAV_HEIGHT = 70;
const CENTER = 78;
const CENTER_RING = 94;
const SIDE_PAD = 26;

interface Props {
  // Horizontal scroll offset of the pager, and the page width
  scrollX: SharedValue<number>;
  width: number;
  bottomInset: number;
  onRanks: () => void;
  onProfile: () => void;
  onTimelapse: () => void;
  onPhoneDown: () => void;
}

/** Thin clear-glass layers: faint fill, light rim, a highlight on the top edge */
function GlassSkin({ radius, shine = true }: { radius: number; shine?: boolean }) {
  return (
    <>
      <LinearGradient
        colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.03)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {shine ? (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.shine, { left: radius * 0.6, right: radius * 0.6 }]}
          pointerEvents="none"
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }]} pointerEvents="none" />
    </>
  );
}

function SideTab({ icon, label, onPress }: { icon: 'podium' | 'person'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.side} hitSlop={6} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={`${icon}-outline`} size={23} color={T.ink} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

/**
 * Floating glass nav, shown on the home page only: ranks · timelapse · profile.
 * Hold the centre button for phone-down mode.
 */
export default function GlassNavBar({ scrollX, width, bottomInset, onRanks, onProfile, onTimelapse, onPhoneDown }: Props) {
  // Fade and sink away as the pager leaves the home page
  const [interactive, setInteractive] = useState(true);
  useAnimatedReaction(
    () => Math.abs(scrollX.value / width - 1) < 0.25,
    (on, prev) => {
      if (on !== prev) runOnJS(setInteractive)(on);
    }
  );
  const shown = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(scrollX.value / width - 1) * 2.5);
    return { opacity: 1 - d, transform: [{ translateY: interpolate(d, [0, 1], [0, 40]) }] };
  });

  const press = useSharedValue(1);
  const centerStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <Animated.View pointerEvents={interactive ? 'box-none' : 'none'} style={[styles.wrap, { bottom: Math.max(bottomInset - 6, 10) }, shown]}>
      <View style={styles.barShadow}>
          <View style={styles.bar}>
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
            <GlassSkin radius={NAV_HEIGHT / 2} />
            <SideTab icon="podium" label="Ranks" onPress={onRanks} />
            <View style={{ width: CENTER_RING }} />
            <SideTab icon="person" label="Profile" onPress={onProfile} />
          </View>
        </View>

      {/* Centre timelapse button, raised out of the bar */}
      <View style={styles.centerSlot} pointerEvents="box-none">
        <View style={styles.centerGlow} pointerEvents="none" />
        <View style={styles.centerRing}>
          <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
          <GlassSkin radius={CENTER_RING / 2} />
          <Animated.View style={centerStyle}>
            <Pressable
              onPress={onTimelapse}
              onLongPress={onPhoneDown}
              delayLongPress={350}
              onPressIn={() => (press.value = withSpring(0.92, { damping: 15, stiffness: 300 }))}
              onPressOut={() => (press.value = withSpring(1, { damping: 12, stiffness: 260 }))}
              accessibilityRole="button"
              accessibilityLabel="Start a timelapse"
              accessibilityHint="Hold for phone down mode"
            >
              <LinearGradient colors={['#FF9A45', T.orange, '#E04800']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.centerBtn}>
                <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} style={styles.gloss} pointerEvents="none" />
                <Ionicons name="videocam" size={30} color={T.white} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: NAV_HEIGHT + 30,
    justifyContent: 'flex-end',
  },
  barShadow: {
    borderRadius: NAV_HEIGHT / 2,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  bar: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD,
  },
  shine: {
    position: 'absolute',
    top: 0,
    height: 1,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: NAV_HEIGHT,
  },
  label: {
    marginTop: 3,
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: T.inkSoft,
  },
  centerSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerGlow: {
    position: 'absolute',
    top: (CENTER_RING - CENTER) / 2,
    width: CENTER,
    height: CENTER,
    borderRadius: CENTER / 2,
    backgroundColor: T.orange,
    shadowColor: T.orange,
    shadowOpacity: 0.75,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 4 },
  },
  centerRing: {
    width: CENTER_RING,
    height: CENTER_RING,
    borderRadius: CENTER_RING / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: CENTER,
    height: CENTER,
    borderRadius: CENTER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,220,180,0.5)',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: CENTER * 0.48,
    borderRadius: CENTER,
  },
});
