import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { optionSelect } from '@/lib/haptics';

export type SessionMode = 'camera' | 'nocamera';

const W = 236;
const PAD = 4;
const SEG = (W - PAD * 2) / 2;

/** Glass switch between a camera timelapse and a phone-down session without camera */
export default function SessionModeSwitch({ value, onChange }: { value: SessionMode; onChange: (m: SessionMode) => void }) {
  const x = useSharedValue(value === 'camera' ? 0 : SEG);
  useEffect(() => {
    x.value = withTiming(value === 'camera' ? 0 : SEG, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [value, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const pick = (m: SessionMode) => {
    if (m === value) return;
    optionSelect();
    x.value = withTiming(m === 'camera' ? 0 : SEG, { duration: 260, easing: Easing.out(Easing.cubic) });
    onChange(m);
  };

  return (
    <View style={styles.track} accessibilityRole="tablist">
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.rim} pointerEvents="none" />
      <Animated.View style={[styles.thumb, thumb]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.06)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.thumbRim} />
      </Animated.View>
      {(
        [
          { m: 'camera', icon: 'videocam', label: 'Camera' },
          { m: 'nocamera', icon: 'phone-portrait-outline', label: 'No camera' },
        ] as const
      ).map(({ m, icon, label }) => {
        const on = value === m;
        return (
          <Pressable key={m} onPress={() => pick(m)} style={styles.seg} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Ionicons name={icon} size={14} color={on ? T.white : T.inkMute} />
            <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: W,
    height: 40,
    padding: PAD,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(14,14,14,0.35)',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: SEG,
    height: 40 - PAD * 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: T.inkMute,
  },
  textOn: {
    color: T.white,
  },
});
