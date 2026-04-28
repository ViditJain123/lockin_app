// Lockin Club — custom bottom tab bar
// Source: design-reference/lockin-club/project/tokens.jsx (LCTabBar)
//
// Five slots. Center slot (camera / index route) is an elevated red record
// button that visually sits above the bar, matching the "LOCK IN" CTA.

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

type IconKind = 'chart' | 'task' | 'trophy' | 'user';

type SlotConfig =
  | { label: string; kind: 'icon'; icon: IconKind }
  | { label: string; kind: 'record' };

// Maps file-based route names in app/(tabs)/ to their visual config.
// Route order in app/(tabs)/_layout.tsx must match TAB_ORDER so that
// state.routes lines up with the design's left-to-right layout.
const ROUTE_CONFIG: Record<string, SlotConfig> = {
  analytics: { label: 'STATS', kind: 'icon', icon: 'chart' },
  tasks: { label: 'TASKS', kind: 'icon', icon: 'task' },
  index: { label: 'LOCK IN', kind: 'record' },
  leaderboard: { label: 'RANKS', kind: 'icon', icon: 'trophy' },
  profile: { label: 'ME', kind: 'icon', icon: 'user' },
};

const TAB_ORDER = ['analytics', 'tasks', 'index', 'leaderboard', 'profile'] as const;

function TabIcon({ kind, active }: { kind: IconKind; active: boolean }) {
  const c = active ? LC.text : LC.textMute;
  const sw = 1.8;
  switch (kind) {
    case 'chart':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 20V10M10 20V4M16 20v-7M22 20H2"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'task':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={4} width={16} height={16} rx={2} stroke={c} strokeWidth={sw} />
          <Path
            d="M8 12l3 3 5-6"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 4h10v6a5 5 0 01-10 0V4z"
            stroke={c}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path
            d="M7 6H4v2a3 3 0 003 3"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17 6h3v2a3 3 0 01-3 3"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 15v4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M8 20h8" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={sw} />
          <Path
            d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}

export function LCTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  const go = (routeName: string, kind: SlotConfig['kind']) => {
    if (kind === 'record') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (routeName !== activeRouteName) {
      Haptics.selectionAsync().catch(() => {});
    }
    navigation.navigate(routeName as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 4, 8) }]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10,10,10,0)', LC.bg, LC.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        {TAB_ORDER.map((name) => {
          const cfg = ROUTE_CONFIG[name];
          const isActive = name === activeRouteName;

          if (cfg.kind === 'record') {
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={cfg.label}
                onPress={() => go(name, 'record')}
                style={styles.recordSlot}
                hitSlop={8}
              >
                <View style={styles.recordShadow}>
                  <View style={styles.recordButton}>
                    <View style={styles.recordSquare} />
                  </View>
                </View>
                <Text style={styles.label}>{cfg.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={cfg.label}
              accessibilityState={isActive ? { selected: true } : undefined}
              onPress={() => go(name, 'icon')}
              style={styles.slot}
              hitSlop={4}
            >
              <TabIcon kind={cfg.icon} active={isActive} />
              <Text
                style={[styles.label, { color: isActive ? LC.text : LC.textMute }]}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recordSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    marginTop: -28,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recordShadow: {
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    borderRadius: 32,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: LC.red,
    borderWidth: 4,
    borderColor: LC.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordSquare: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  label: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
});

export default LCTabBar;
