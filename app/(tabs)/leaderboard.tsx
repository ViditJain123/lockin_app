import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LCBackButton } from '@/components/lc/LCBackButton';
import InitialsAvatar from '@/components/profile/InitialsAvatar';
import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_DATA_ENABLED } from '@/lib/config';
import { optionSelect } from '@/lib/haptics';
import { useFriendsStore } from '@/store/useFriendsStore';
import { useLeaderboardStore, type LeaderboardUser } from '@/store/useLeaderboardStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0m';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const nameOf = (e: LeaderboardUser) => e.display_name || 'Anonymous';

// Dev-only filler so the board can be previewed before real ranks exist
const DEMO_NAMES = [
  'Aarav Mehta', 'Riya Kapoor', 'Kabir Shah', 'Ananya Rao', 'Vihaan Joshi', 'Isha Nair',
  'Arjun Desai', 'Meera Iyer', 'Dev Malhotra', 'Sara Khan', 'Rohan Gupta', 'Tara Bose',
  'Neel Verma', 'Zoya Ali', 'Kiran Patel', 'Aisha Reddy', 'Yash Sinha', 'Diya Menon',
  'Om Kulkarni', 'Nina Das', 'Vikram Rao', 'Pooja Jain', 'Aditya Roy',
];
function demoBoard(userId: string, youName: string): LeaderboardUser[] {
  const YOU_RANK = 14;
  const out: LeaderboardUser[] = [];
  let hours = 92.5;
  let n = 0;
  for (let rank = 1; rank <= 24; rank++) {
    const isYou = rank === YOU_RANK;
    out.push({
      user_id: isYou ? userId : `demo-${rank}`,
      display_name: isYou ? youName : DEMO_NAMES[n++ % DEMO_NAMES.length],
      total_hours: Math.round(hours * 4) / 4,
      rank,
    });
    hours -= 2 + ((rank * 37) % 5) * 0.6;
  }
  return out;
}

// ─── Avatar ───────────────────────────────────────────────────────────────

function Avatar({ entry, size, ring, isMe }: { entry: LeaderboardUser; size: number; ring?: string; isMe?: boolean }) {
  return (
    <View
      style={{
        borderRadius: size / 2 + 3,
        borderColor: ring ?? 'transparent',
        borderWidth: ring ? 3 : 0,
      }}
    >
      <InitialsAvatar id={entry.user_id} size={ring ? size - 6 : size} isMe={isMe} />
    </View>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────

const PLACES = {
  1: { colors: ['#FF8A33', '#FF6600', '#C94400'] as const, ring: '#FFC93C', badge: '#FFC93C', height: 1 },
  2: { colors: ['#FFDD7A', '#FFC93C', '#D99A00'] as const, ring: '#FFE6A8', badge: '#FFE6A8', height: 0.74 },
  3: { colors: ['#FFEBD6', '#F2C9A2', '#C98F5E'] as const, ring: '#FFEBD6', badge: '#FFEBD6', height: 0.58 },
};

function PodiumColumn({
  entry,
  place,
  width,
  maxHeight,
  isYou,
}: {
  entry: LeaderboardUser | null;
  place: 1 | 2 | 3;
  width: number;
  maxHeight: number;
  isYou: boolean;
}) {
  const cfg = PLACES[place];
  const colH = Math.round(maxHeight * cfg.height);
  const avatarSize = place === 1 ? 74 : 60;

  return (
    <View style={{ width, alignItems: 'center' }}>
      {place === 1 ? <Text style={styles.crown}>👑</Text> : null}
      <View style={{ marginBottom: -avatarSize / 2, zIndex: 2, alignItems: 'center' }}>
        {entry ? (
          <Avatar entry={entry} size={avatarSize} ring={cfg.ring} isMe={isYou} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
        )}
        <View style={[styles.placeBadge, { backgroundColor: cfg.badge }]}>
          <Text style={styles.placeBadgeText}>{place}</Text>
        </View>
      </View>

      <LinearGradient
        colors={cfg.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.column, { height: colH }, place === 1 && styles.columnGlow]}
      >
        <Text style={styles.colName} numberOfLines={1}>
          {entry ? (isYou ? 'You' : nameOf(entry).split(' ')[0]) : '—'}
        </Text>
        <Text style={styles.colHours}>{entry ? fmtHours(entry.total_hours) : ''}</Text>
        <Text style={[styles.colNumeral, { fontSize: place === 1 ? 120 : 96 }]}>{place}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────

function RankRow({ entry, isYou }: { entry: LeaderboardUser; isYou: boolean }) {
  return (
    <View style={[styles.row, isYou && styles.rowYou]}>
      <Avatar entry={entry} size={40} isMe={isYou} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {isYou ? `${nameOf(entry)} (you)` : nameOf(entry)}
        </Text>
        <Text style={styles.rowSub}>{fmtHours(entry.total_hours)} locked in</Text>
      </View>
      <Text style={[styles.rowRank, isYou && { color: T.orange }]}>#{entry.rank}</Text>
    </View>
  );
}

function YouCard({
  rank,
  hours,
  name,
  userId,
  gap,
  total,
}: {
  rank: number | null;
  hours: number;
  name: string;
  userId: string;
  gap: { hours: number; rank: number } | null;
  total: number;
}) {
  const me: LeaderboardUser = { user_id: userId, display_name: name, total_hours: hours, rank: rank ?? 0 };
  const sub =
    rank == null
      ? 'Lock in once this month to get ranked'
      : rank === 1
        ? "You're #1. Hold the crown"
        : gap
          ? `${fmtHours(gap.hours)} behind #${gap.rank}`
          : `${fmtHours(hours)} locked in`;
  return (
    <View style={styles.youCard}>
      <Avatar entry={me} size={44} ring={T.orange} isMe />
      <View style={styles.rowText}>
        <Text style={styles.youLabel}>YOUR RANK{total > 0 && rank != null ? ` · TOP ${Math.max(1, Math.round((rank / total) * 100))}%` : ''}</Text>
        <Text style={styles.youSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.youRank}>{rank != null ? `#${rank}` : '—'}</Text>
        <Text style={styles.youHours}>{fmtHours(hours)}</Text>
      </View>
    </View>
  );
}

// ─── Scope toggle ─────────────────────────────────────────────────────────

type Scope = 'global' | 'friends';
const TOGGLE_W = 240;
const PAD = 4;
const SEG_W = (TOGGLE_W - PAD * 2) / 2;
const SLIDE = { duration: 320, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/** Glass segmented control: tap a side or drag the thumb across */
function ScopeToggle({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const x = useSharedValue(value === 'global' ? 0 : SEG_W);
  const startX = useSharedValue(0);

  useEffect(() => {
    x.value = withTiming(value === 'global' ? 0 : SEG_W, SLIDE);
  }, [value, x]);

  const commit = useCallback(
    (s: Scope) => {
      if (s !== value) {
        optionSelect();
        onChange(s);
      }
    },
    [value, onChange]
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .onStart(() => {
      cancelAnimation(x);
      startX.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(SEG_W, Math.max(0, startX.value + e.translationX));
    })
    .onEnd((e) => {
      const target = x.value + e.velocityX * 0.08 > SEG_W / 2 ? SEG_W : 0;
      x.value = withTiming(target, SLIDE);
      runOnJS(commit)(target === 0 ? 'global' : 'friends');
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const s: Scope = e.x < TOGGLE_W / 2 ? 'global' : 'friends';
    x.value = withTiming(s === 'global' ? 0 : SEG_W, SLIDE);
    runOnJS(commit)(s);
  });

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const globalText = useAnimatedStyle(() => ({ color: interpolateColor(x.value, [0, SEG_W], [T.white, T.inkMute]) }));
  const friendsText = useAnimatedStyle(() => ({ color: interpolateColor(x.value, [0, SEG_W], [T.inkMute, T.white]) }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View style={styles.toggle} accessibilityRole="tablist">
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.toggleRim} pointerEvents="none" />
        <Animated.View style={[styles.toggleThumb, thumb]} pointerEvents="none">
          {/* Clear glass: almost no fill, light caught on the top edge */}
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.04)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.thumbShine}
          />
          <View style={styles.thumbRim} />
        </Animated.View>
        <View style={styles.toggleSeg} accessibilityRole="tab" accessibilityState={{ selected: value === 'global' }}>
          <Animated.Text style={[styles.toggleText, globalText]}>Global</Animated.Text>
        </View>
        <View style={styles.toggleSeg} accessibilityRole="tab" accessibilityState={{ selected: value === 'friends' }}>
          <Animated.Text style={[styles.toggleText, friendsText]}>Friends</Animated.Text>
        </View>
      </View>
    </GestureDetector>
  );
}

// Monday to Sunday of the current week, e.g. "10–16 NOV"
function weekLabel(): string {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const m = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return mon.getMonth() === sun.getMonth()
    ? `${mon.getDate()}–${sun.getDate()} ${m(sun)}`
    : `${mon.getDate()} ${m(mon)} – ${sun.getDate()} ${m(sun)}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const userId = user?.id ?? 'you';
  const quizName = useOnboardingStore((s) => s.quizAnswers.name);

  const rawEntries = useLeaderboardStore((s) => s.entries);
  const currentUserRank = useLeaderboardStore((s) => s.currentUserRank);
  const currentUserHours = useLeaderboardStore((s) => s.currentUserHours);
  const isLoading = useLeaderboardStore((s) => s.isLoading);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);

  const youName =
    quizName?.trim() || (user?.user_metadata?.full_name as string | undefined) || 'You';

  const [scope, setScope] = useState<Scope>('global');
  const friends = useFriendsStore((s) => s.friends);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);
  useEffect(() => {
    if (user?.id && friends.length === 0) fetchFriends(user.id);
  }, [user?.id, friends.length, fetchFriends]);

  const useDemo = DEMO_DATA_ENABLED && rawEntries.length < 4 && !isLoading;
  const globalEntries = useMemo(
    () =>
      useDemo
        ? demoBoard(userId, youName)
        : rawEntries.map((e) => (e.user_id === userId && !e.display_name ? { ...e, display_name: youName } : e)),
    [useDemo, rawEntries, userId, youName]
  );

  // Friends board: you plus your friends, ranked by hours this week
  // TODO: switch both boards to Monday–Sunday hours from the backend
  const myGlobalHours = globalEntries.find((e) => e.user_id === userId)?.total_hours ?? currentUserHours ?? 0;
  const friendEntries = useMemo(() => {
    const list = [
      { user_id: userId, display_name: youName, total_hours: myGlobalHours },
      ...friends.map((f) => ({ user_id: f.id, display_name: f.name, total_hours: f.weekHours ?? 0 })),
    ].sort((a, b) => b.total_hours - a.total_hours);
    return list.map((e, i) => ({ ...e, rank: i + 1 })) as LeaderboardUser[];
  }, [friends, userId, youName, myGlobalHours]);

  const entries = scope === 'global' ? globalEntries : friendEntries;

  const refresh = useCallback(() => {
    if (!user?.id) return;
    useLeaderboardStore.setState({ lastFetched: null });
    fetchLeaderboard(user.id);
  }, [user?.id, fetchLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchLeaderboard(user.id);
    }, [user?.id, fetchLeaderboard])
  );

  const meEntry = entries.find((e) => e.user_id === userId);
  const fromBoard = useDemo || scope === 'friends';
  const myRank = fromBoard ? meEntry?.rank ?? null : currentUserRank ?? meEntry?.rank ?? null;
  const myHours = fromBoard ? meEntry?.total_hours ?? 0 : currentUserHours ?? meEntry?.total_hours ?? 0;

  const sorted = useMemo(() => [...entries].sort((a, b) => a.rank - b.rank), [entries]);
  const top = (r: number) => sorted.find((e) => e.rank === r) ?? null;
  const rest = sorted.filter((e) => e.rank > 3);

  // Hours needed to pass the person directly above you
  const gap = useMemo(() => {
    if (myRank == null || myRank <= 1) return null;
    const above = sorted.find((e) => e.rank === myRank - 1);
    if (!above) return null;
    return { hours: Math.max(above.total_hours - myHours, 0) + 1 / 60, rank: above.rank };
  }, [sorted, myRank, myHours]);

  const colW = (width - 32 - 20) / 3;
  const podiumH = Math.min(210, Math.max(150, height * 0.22));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <LCBackButton />
        <Text style={styles.title}>Ranks</Text>
        <View style={styles.monthPill}>
          <Text style={styles.monthText}>{weekLabel()}</Text>
        </View>
      </View>
      <View style={styles.toggleRow}>
        <ScopeToggle value={scope} onChange={setScope} />
      </View>

      {isLoading && entries.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.orange} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No ranks yet</Text>
          <Text style={styles.emptySub}>Finish a session to land on the board.</Text>
        </View>
      ) : (
        <>
          {/* Podium: 2 · 1 · 3 */}
          <View style={styles.podium}>
            <PodiumColumn entry={top(2)} place={2} width={colW} maxHeight={podiumH} isYou={top(2)?.user_id === userId} />
            <PodiumColumn entry={top(1)} place={1} width={colW} maxHeight={podiumH} isYou={top(1)?.user_id === userId} />
            <PodiumColumn entry={top(3)} place={3} width={colW} maxHeight={podiumH} isYou={top(3)?.user_id === userId} />
          </View>

          {/* Sheet */}
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 110 + insets.bottom }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={T.orange} />}
            >
              {rest.length === 0 ? (
                <Text style={styles.emptySub}>Only the podium so far. Grab a spot.</Text>
              ) : (
                rest.map((e) => <RankRow key={e.user_id} entry={e} isYou={e.user_id === userId} />)
              )}
            </ScrollView>

            {/* Your rank, always visible */}
            <View style={[styles.youWrap, { paddingBottom: insets.bottom + 12 }]}>
              <LinearGradient
                colors={['rgba(22,22,22,0)', T.card]}
                style={styles.youFade}
                pointerEvents="none"
              />
              <YouCard rank={myRank} hours={myHours} name={youName} userId={userId} gap={gap} total={entries.length} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: T.ink,
  },
  monthPill: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: T.yellow,
  },
  toggleRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  toggle: {
    width: TOGGLE_W,
    height: 46,
    padding: PAD,
    borderRadius: 23,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  toggleRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toggleThumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: SEG_W,
    height: 46 - PAD * 2,
    borderRadius: 19,
    overflow: 'hidden',
  },
  thumbRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  thumbShine: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
  },
  toggleSeg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  crown: {
    fontSize: 22,
    marginBottom: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: {
    backgroundColor: T.sunk,
    borderWidth: 2,
    borderColor: T.lineStrong,
    borderStyle: 'dashed',
  },
  avatarText: {
    fontFamily: Fonts.bold,
    color: '#0E0E0E',
  },
  placeBadge: {
    position: 'absolute',
    bottom: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.canvas,
  },
  placeBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: '#0E0E0E',
  },
  column: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    alignItems: 'center',
    paddingTop: 54,
    overflow: 'hidden',
  },
  columnGlow: {
    shadowColor: T.orange,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  colName: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0E0E0E',
    paddingHorizontal: 6,
  },
  colHours: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    color: 'rgba(14,14,14,0.65)',
    marginTop: 1,
  },
  colNumeral: {
    position: 'absolute',
    bottom: -18,
    fontFamily: Fonts.display,
    color: 'rgba(14,14,14,0.14)',
  },

  // Sheet
  sheet: {
    flex: 1,
    marginTop: -2,
    backgroundColor: T.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.cardHi,
    marginBottom: 8,
  },
  rowYou: {
    backgroundColor: T.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.45)',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: T.ink,
  },
  rowSub: {
    marginTop: 1,
    fontFamily: Fonts.monoMedium,
    fontSize: 10.5,
    color: T.inkMute,
  },
  rowRank: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: T.ink,
    letterSpacing: 0.5,
  },

  // Pinned you card
  youWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: T.card,
  },
  youFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -28,
    height: 28,
  },
  youCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: '#2A1606',
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.6)',
    shadowColor: T.orange,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  youLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: T.orange,
  },
  youSub: {
    marginTop: 2,
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.ink,
  },
  youRank: {
    fontFamily: Fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: T.yellow,
  },
  youHours: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10.5,
    color: T.inkSoft,
  },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 120,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: T.ink,
  },
  emptySub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkMute,
    textAlign: 'center',
    marginTop: 8,
  },
});
