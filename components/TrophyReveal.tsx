import { Ionicons } from '@expo/vector-icons';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import Mascot from '@/components/Mascot';
import MascotTrophy, { TROPHY_FLOOD } from '@/components/MascotTrophy';
import { type CrystalDefinition, TIER_LABELS } from '@/constants/Crystals';
import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { animationReveal, buttonPress, optionSelect } from '@/lib/haptics';
import { playSound } from '@/lib/sound';

const OPEN_MS = 560;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

export interface RevealOrigin {
  x: number;
  y: number;
  size: number;
}

interface Props {
  // null = the level-0 mascot (no trophy yet)
  crystal: CrystalDefinition | null;
  earned: boolean;
  earnedAt?: number;
  level: number;
  origin: RevealOrigin;
  onClose: () => void;
}

/**
 * Badge-share style reveal: the trophy flies from where it was tapped to a hero
 * slot while its tier colour floods the screen, then the title slides in.
 */
export default function TrophyReveal({ crystal, earned, earnedAt, level, origin, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const shareRef = useRef<View>(null);

  const HERO = Math.min(width * 0.86, 360);
  const heroX = (width - HERO) / 2;
  const heroY = insets.top + 28;
  const diag = Math.sqrt(width * width + height * height) * 2.1;

  useEffect(() => {
    progress.value = withTiming(1, { duration: OPEN_MS, easing: EASE });
    if (earned || !crystal) {
      animationReveal();
      playSound('ping');
    } else {
      optionSelect();
      playSound('tap');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    optionSelect();
    progress.value = withTiming(0, { duration: 420, easing: EASE }, (done) => {
      if (done) runOnJS(onClose)();
    });
  }, [progress, onClose]);

  const share = useCallback(async () => {
    if (!shareRef.current) return;
    buttonPress();
    try {
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your trophy' });
    } catch (e) {
      console.warn('[TrophyReveal] share failed:', e);
    }
  }, []);

  const ox = origin.x + origin.size / 2;
  const oy = origin.y + origin.size / 2;
  const os = origin.size;

  const floodStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [os / diag, 1]) }],
    opacity: interpolate(progress.value, [0, 0.08, 1], [0, 1, 1]),
  }));

  const heroStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: interpolate(p, [0, 1], [ox - (heroX + HERO / 2), 0]) },
        { translateY: interpolate(p, [0, 1], [oy - (heroY + HERO / 2), 0]) },
        { scale: interpolate(p, [0, 1], [os / HERO, 1]) },
        { rotate: `${interpolate(p, [0, 0.6, 1], [0, -6, 0])}deg` },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.55, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [0.55, 1], [36, 0], 'clamp') }],
  }));

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.7, 1], [0, 1], 'clamp'),
  }));

  // Colours + copy
  const flood = crystal
    ? earned
      ? TROPHY_FLOOD[crystal.tier]
      : { bg: '#1C1C1C', fg: T.ink }
    : { bg: '#FF6600', fg: '#0E0E0E' };
  const darkText = flood.fg !== T.ink;
  const article = crystal && /^[aeiou]/i.test(crystal.name) ? 'AN' : 'A';

  const kicker = crystal ? (earned ? `YOU'RE ${article}` : 'LOCKED') : `LEVEL ${level}`;
  const name = crystal ? crystal.name.toUpperCase() : 'FRESH START';
  const lore = crystal ? crystal.lore : 'Every legend starts with the plain bot.';
  const meta = crystal
    ? earned
      ? `${TIER_LABELS[crystal.tier]} · Level ${crystal.milestoneLevel}${earnedAt ? ` · Earned ${new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
      : `Unlocks at level ${crystal.milestoneLevel} · you're level ${level}`
    : 'Your first trophy, Rookie, unlocks at level 1';

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar style={darkText ? 'dark' : 'light'} />
      <View ref={shareRef} collapsable={false} style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flood,
            { width: diag, height: diag, borderRadius: diag / 2, left: ox - diag / 2, top: oy - diag / 2, backgroundColor: flood.bg },
            floodStyle,
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: heroX, top: heroY, width: HERO, height: HERO }, heroStyle]}
        >
          {crystal ? (
            <MascotTrophy tier={crystal.tier} accessory={crystal.accessory} size={HERO} locked={!earned} />
          ) : (
            <Mascot size={HERO} />
          )}
        </Animated.View>

        <Animated.View style={[styles.detailText, { top: heroY + HERO + 20 }, textStyle]}>
          <Text style={[styles.kicker, { color: flood.fg }]}>{kicker}</Text>
          <Text style={[styles.bigName, { color: flood.fg }]} numberOfLines={2} adjustsFontSizeToFit>
            {name}
          </Text>
          <Text style={[styles.lore, { color: flood.fg }]}>{lore}</Text>
          <Text style={[styles.meta, { color: flood.fg }]}>{meta}</Text>
          <Text style={[styles.watermark, { color: flood.fg }]}>LOCKIN CLUB</Text>
        </Animated.View>
      </View>

      {/* Chrome (not part of the share image) */}
      <Animated.View style={[styles.closeWrap, { top: insets.top + 8 }, chromeStyle]}>
        <Pressable
          onPress={close}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: darkText ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={flood.fg} />
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.shareWrap, { bottom: insets.bottom + 18 }, chromeStyle]}>
        {crystal && earned ? (
          <Pressable
            onPress={share}
            style={({ pressed }) => [styles.shareBtn, !darkText && styles.shareBtnLight, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Share trophy"
          >
            <Text style={[styles.shareText, !darkText && styles.shareTextDark]}>SHARE</Text>
          </Pressable>
        ) : (
          <View style={[styles.lockedPill, darkText && styles.lockedPillOnLight]}>
            <Ionicons name={crystal ? 'lock-closed' : 'sparkles'} size={14} color={darkText ? '#0E0E0E' : T.inkSoft} />
            <Text style={[styles.lockedText, darkText && { color: '#0E0E0E' }]}>
              {crystal ? `${Math.max(crystal.milestoneLevel - level, 0)} levels to go` : 'Finish a session to reach level 1'}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  flood: {
    position: 'absolute',
  },
  detailText: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  kicker: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 13,
    letterSpacing: 3,
    opacity: 0.8,
  },
  bigName: {
    marginTop: 2,
    fontFamily: Fonts.display,
    fontSize: 76,
    lineHeight: 78,
    textAlign: 'center',
    letterSpacing: 1,
  },
  lore: {
    marginTop: 8,
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.85,
  },
  meta: {
    marginTop: 10,
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.6,
    textAlign: 'center',
  },
  watermark: {
    marginTop: 18,
    fontFamily: Fonts.dmSansBold,
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.45,
  },
  closeWrap: {
    position: 'absolute',
    right: 16,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  shareBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnLight: {
    backgroundColor: T.yellow,
  },
  shareText: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: 2,
    color: T.yellow,
  },
  shareTextDark: {
    color: '#0E0E0E',
  },
  lockedPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lockedPillOnLight: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  lockedText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: T.inkSoft,
  },
});
