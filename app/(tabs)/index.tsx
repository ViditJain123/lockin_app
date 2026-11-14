import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import { Easing, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DitherWeekChart, { ChartLegend } from '@/components/charts/DitherWeekChart';
import ClaimScreenTimeModal, { formatMinutes } from '@/components/ClaimScreenTimeModal';
import BrainHero from '@/components/dashboard/BrainHero';
import { formatHM } from '@/components/dashboard/TodayCard';
import LevelUpToast from '@/components/LevelUpToast';
import Mascot from '@/components/Mascot';
import GlassNavBar, { NAV_HEIGHT } from '@/components/nav/GlassNavBar';
import TrophyReveal, { type RevealOrigin } from '@/components/TrophyReveal';
import { CRYSTALS_BY_LEVEL, type CrystalDefinition } from '@/constants/Crystals';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { HomePagerContext, PAGE, useHomePager, type HomePagerValue } from '@/contexts/HomePager';
import { useThisWeek } from '@/lib/focusData';
import { buttonPress, mascotWink, optionSelect } from '@/lib/haptics';
import { computeXP, levelFromXP, xpProgressInLevel } from '@/lib/xp';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useOnboardingStore, type SleepTime } from '@/store/useOnboardingStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';

import LeaderboardScreen from './leaderboard';
import ProfileScreen from './profile';

// Minutes until the user's bedtime, or negative once it has passed.
// Bedtime "tonight" is treated as still upcoming until 5am.
function minutesUntilBed(sleep: SleepTime, now = new Date()): number {
  let h = sleep.hour % 12;
  if (sleep.period === 'PM') h += 12;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const bedMin = h * 60 + sleep.minute;
  if (now.getHours() < 5 && bedMin > 12 * 60) return -(nowMin + 24 * 60 - bedMin);
  return bedMin - nowMin;
}

function BedtimeChip({ sleep }: { sleep: SleepTime }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const mins = minutesUntilBed(sleep);
  const past = mins < 0;
  const soon = !past && mins <= 60;
  const alert = past || soon;
  const label = past ? 'Past bedtime' : soon ? `Wind down · ${formatHM(mins)}` : `Bed in ${formatHM(mins)}`;

  return (
    <View style={[styles.chip, alert && styles.chipAlert]}>
      <Ionicons name="moon" size={12} color={alert ? T.black : T.yellow} />
      <Text style={[styles.chipText, alert && styles.chipTextAlert]}>{label}</Text>
    </View>
  );
}

function DashboardScreen() {
  const pager = useHomePager();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user } = useAuth();

  const quizName = useOnboardingStore((s) => s.quizAnswers.name);
  const sleepTime = useOnboardingStore((s) => s.quizAnswers.sleepTime);
  const targetHoursRaw = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const targetHours = typeof targetHoursRaw === 'number' && targetHoursRaw > 0 ? targetHoursRaw : 4;

  const streak = useProfileStatsStore((s) => s.streak) ?? 0;
  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);

  const isFullyUnlocked = useAppLockStore((s) => s.isFullyUnlocked);
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());
  const canClaim = Platform.OS === 'ios' && !isFullyUnlocked && availableScreenTime >= 60;
  const [showClaimModal, setShowClaimModal] = useState(false);

  const rightEyeOpen = useSharedValue(1);

  // Level mascot reveal
  const earnedList = useCrystalStore((s) => s.earnedCrystals);
  const levelPillRef = useRef<View>(null);
  const levelNextRef = useRef<View>(null);
  const [reveal, setReveal] = useState<{ crystal: CrystalDefinition | null; origin: RevealOrigin } | null>(null);
  useEffect(() => {
    pager?.setNavHidden(!!reveal);
  }, [pager, reveal]);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
    }, [])
  );

  const { days, todayIndex, today } = useThisWeek();
  const weekFocus = days.reduce((a, d) => a + d.focusMin, 0);
  const weekScreen = days.reduce((a, d) => a + d.screenMin, 0);

  // Level
  const xp = computeXP({ totalHours, totalGrinds: grinds });
  const { level, fraction } = xpProgressInLevel(xp);

  // Level-up toast when the user crosses into a new level
  const currentLevel = useMemo(() => levelFromXP(xp), [xp]);
  const lastLevelRef = useRef<number | null>(null);
  const [toastLevel, setToastLevel] = useState<number | null>(null);
  useEffect(() => {
    if (lastLevelRef.current === null) {
      lastLevelRef.current = currentLevel;
      return;
    }
    if (currentLevel > lastLevelRef.current) setToastLevel(currentLevel);
    lastLevelRef.current = currentLevel;
  }, [currentLevel]);

  const earnedMap = useMemo(() => new Map(earnedList.map((e) => [e.crystalId, e.earnedAt])), [earnedList]);
  // Mascot for the level you're on (highest trophy reached), and the next one
  const currentTrophy = useMemo(
    () => [...CRYSTALS_BY_LEVEL].reverse().find((c) => c.milestoneLevel <= level) ?? null,
    [level]
  );
  const nextTrophy = useMemo(() => CRYSTALS_BY_LEVEL.find((c) => c.milestoneLevel > level) ?? null, [level]);

  const openLevel = (which: 'current' | 'next') => {
    const ref = which === 'current' ? levelPillRef : levelNextRef;
    const crystal = which === 'current' ? currentTrophy : nextTrophy;
    ref.current?.measureInWindow((x, y, w, h) => {
      const size = Math.max(w, h);
      setReveal({ crystal, origin: { x: x + w / 2 - size / 2, y: y + h / 2 - size / 2, size } });
    });
  };

  const firstName = quizName?.trim() || user?.user_metadata?.full_name?.split(' ')[0] || 'friend';

  const winkMascot = () => {
    mascotWink();
    rightEyeOpen.value = withSequence(
      withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }),
      withTiming(0, { duration: 90 }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
    );
  };

  const openStats = () => {
    buttonPress();
    router.push('/analytics' as any);
  };

  // Short phones (SE / mini) get a shorter chart so nothing has to scroll
  const compact = height < 760;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 + (pager?.navSpace ?? 0) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu and settings"
          onPress={() => {
            buttonPress();
            router.push('/settings-page');
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, styles.menuLineShort]} />
        </Pressable>
        <Text style={styles.wordmark}>
          LOCKIN <Text style={styles.wordmarkAccent}>CLUB</Text>
        </Text>
        <Pressable onPress={winkMascot} hitSlop={8} accessibilityLabel="Lockin Club mascot">
          <Mascot size={42} rightEyeOpen={rightEyeOpen} />
        </Pressable>
      </View>

      {/* Level: tap your level to see its mascot, the next one to open trophies */}
      <View style={styles.levelRow}>
        <Pressable
          ref={levelPillRef}
          onPress={() => openLevel('current')}
          hitSlop={8}
          style={({ pressed }) => [styles.levelPill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Level ${level}. Show mascot`}
        >
          <Text style={styles.levelPillText}>LV {level}</Text>
        </Pressable>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${Math.max(fraction * 100, 3)}%` }]} />
        </View>
        <Pressable
          ref={levelNextRef}
          onPress={() => {
            buttonPress();
            router.push('/trophies' as any);
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.levelNextBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open trophies"
          accessibilityHint={`Next trophy at level ${nextTrophy?.milestoneLevel ?? level + 1}`}
        >
          <Ionicons name="trophy" size={12} color={T.yellow} />
          <Text style={styles.levelNext}>LV {level + 1}</Text>
          <Ionicons name="chevron-forward" size={12} color={T.inkSoft} />
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetHi} numberOfLines={1}>
            Hi, {firstName}
          </Text>
          <Text style={styles.greetLine}>let's reclaim your focus.</Text>
        </View>
        <BedtimeChip sleep={sleepTime} />
      </View>

      {canClaim && (
        <Pressable
          onPress={() => {
            buttonPress();
            setShowClaimModal(true);
          }}
          style={({ pressed }) => [styles.claim, pressed && styles.pressed]}
        >
          <Ionicons name="hourglass-outline" size={16} color={T.orange} />
          <Text style={styles.claimText}>{formatMinutes(availableScreenTime)} of screen time earned</Text>
          <Text style={styles.claimCta}>Use</Text>
        </Pressable>
      )}

      <View style={styles.body}>
        <BrainHero todayMinutes={today.focusMin} targetHours={targetHours} streak={streak} onPress={() => router.push('/analytics' as any)} />

        {/* Week: lock-in up, screen time down */}
        <Pressable onPress={openStats} style={({ pressed }) => [styles.weekCard, pressed && styles.pressedSoft]}>
          <View style={styles.weekHeader}>
            <View>
              <Text style={styles.cardLabel}>This week</Text>
              <Text style={styles.weekTotals}>
                <Text style={{ color: T.yellow }}>+{formatHM(weekFocus)}</Text>
                <Text style={styles.weekDivider}>{'  /  '}</Text>
                <Text style={{ color: T.orange }}>−{formatHM(weekScreen)}</Text>
              </Text>
            </View>
            <ChartLegend />
          </View>
          <DitherWeekChart days={days} todayIndex={todayIndex} height={compact ? 105 : 140} />
        </Pressable>
      </View>


      <ClaimScreenTimeModal visible={showClaimModal} onClose={() => setShowClaimModal(false)} source="dashboard" />
      <LevelUpToast level={toastLevel} onDismiss={() => setToastLevel(null)} />

      {reveal && (
        <TrophyReveal
          crystal={reveal.crystal}
          earned={reveal.crystal ? earnedMap.has(reveal.crystal.id) || reveal.crystal.milestoneLevel <= level : true}
          earnedAt={reveal.crystal ? earnedMap.get(reveal.crystal.id) : undefined}
          level={level}
          origin={reveal.origin}
          onClose={() => setReveal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  pressedSoft: {
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...cardShadow,
  },
  menuLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: T.ink,
  },
  menuLineShort: {
    width: 11,
    marginRight: 7,
  },
  wordmark: {
    fontFamily: Fonts.dmSansBold,
    fontSize: 17,
    letterSpacing: 1.5,
    color: T.ink,
  },
  wordmarkAccent: {
    color: T.orange,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  greetHi: {
    fontFamily: Fonts.medium,
    fontSize: 26,
    color: T.ink,
  },
  greetLine: {
    fontFamily: Fonts.medium,
    fontSize: 26,
    lineHeight: 30,
    color: T.inkMute,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineStrong,
  },
  chipAlert: {
    backgroundColor: T.yellow,
    borderColor: T.yellow,
  },
  chipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: T.ink,
  },
  chipTextAlert: {
    color: T.black,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  levelPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: T.yellow,
  },
  levelPillText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    letterSpacing: 1,
    color: T.black,
  },
  levelTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.sunk,
    overflow: 'hidden',
  },
  levelFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: T.yellow,
  },
  levelNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,201,60,0.45)',
    backgroundColor: T.yellowSoft,
  },

  levelNext: {
    fontFamily: Fonts.display,
    fontSize: 15,
    letterSpacing: 1,
    color: T.ink,
  },
  claim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: T.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.35)',
    marginBottom: 12,
  },
  claimText: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: T.ink,
  },
  claimCta: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.orange,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 14,
    paddingTop: 6,
  },
  cardLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: T.inkSoft,
  },
  weekCard: {
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    ...cardShadow,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekTotals: {
    marginTop: 2,
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: 0.5,
  },
  weekDivider: {
    color: T.inkMute,
    fontSize: 18,
  },
});

// ─── Home pager: ranks ← home → profile, with the glass nav on top ────────

// Gesture-handler ScrollView, so a horizontal drag inside a page (the ranks
// toggle) wins over paging instead of both moving at once
const PagerScroll = Animated.createAnimatedComponent(GHScrollView);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<any>(null);
  const scrollX = useSharedValue(width);
  const pageRef = useRef<number>(PAGE.home);
  const [navHidden, setNavHidden] = useState(false);

  const goTo = useCallback(
    (page: number) => {
      scrollRef.current?.scrollTo({ x: page * width, animated: true });
    },
    [width]
  );

  const onSettle = useCallback((page: number) => {
    if (page !== pageRef.current) {
      pageRef.current = page;
      optionSelect();
    }
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
    onMomentumEnd: (e) => {
      runOnJS(onSettle)(Math.round(e.contentOffset.x / width));
    },
  });

  // Start on the home page
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: width, animated: false }));
  }, [width]);



  const ctx = useMemo<HomePagerValue>(() => ({ goTo, setNavHidden, navSpace: NAV_HEIGHT + 24 }), [goTo]);

  return (
    <HomePagerContext.Provider value={ctx}>
      <View style={{ flex: 1, backgroundColor: T.canvas }}>
        <PagerScroll
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: width, y: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width }}>
            <LeaderboardScreen />
          </View>
          <View style={{ width }}>
            <DashboardScreen />
          </View>
          <View style={{ width }}>
            <ProfileScreen />
          </View>
        </PagerScroll>

        {!navHidden && (
          <GlassNavBar
            scrollX={scrollX}
            width={width}
            bottomInset={insets.bottom}
            onRanks={() => {
              optionSelect();
              goTo(PAGE.ranks);
            }}
            onProfile={() => {
              optionSelect();
              goTo(PAGE.profile);
            }}
            onTimelapse={() => {
              buttonPress();
              router.push('/record' as any);
            }}
            onPhoneDown={() => {
              buttonPress();
              router.push('/stopwatch' as any);
            }}
          />
        )}
      </View>
    </HomePagerContext.Provider>
  );
}
