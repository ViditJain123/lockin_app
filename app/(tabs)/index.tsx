import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Easing, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import ClaimScreenTimeModal, { formatMinutes } from '@/components/ClaimScreenTimeModal';
import FocusTodayCard from '@/components/dashboard/FocusTodayCard';
import GlowCard, { GlowShape } from '@/components/dashboard/GlowCard';
import LevelUpToast from '@/components/LevelUpToast';
import Mascot from '@/components/Mascot';
import { BrandColors } from '@/constants/BrandColors';
import { CRYSTALS } from '@/constants/Crystals';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalDateStringDaysAgo } from '@/lib/dateUtils';
import { buttonPress, mascotWink } from '@/lib/haptics';
import { computeXP, levelFromXP } from '@/lib/xp';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useVideoGalleryStore } from '@/store/useVideoGalleryStore';

const LIGHT = '#F3F3F1';
const INK = BrandColors.palette.ink;
const ORANGE = BrandColors.palette.orange;

const greetingForNow = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// 0-3 dots depending on how long the user focused that day
const intensity = (minutes: number) =>
  minutes <= 0 ? 0 : minutes < 30 ? 1 : minutes < 90 ? 2 : 3;

const DOT_COLORS = [ORANGE, INK, BrandColors.palette.yellow];

function DayCell({ daysAgo, minutes }: { daysAgo: number; minutes: number }) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const isToday = daysAgo === 0;
  const level = intensity(minutes);

  return (
    <View style={styles.dayCell}>
      <View>
        <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>{date.getDate()}</Text>
        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
          {date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}
        </Text>
      </View>
      <View style={styles.dots}>
        {DOT_COLORS.map((color, i) => (
          <View
            key={i}
            style={[styles.dot, i < level ? { backgroundColor: color } : styles.dotEmpty]}
          />
        ))}
      </View>
    </View>
  );
}

interface Tool {
  title: string;
  subtitle: string;
  shape: GlowShape;
  onPress: () => void;
}

function ToolRow({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <View style={styles.toolSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
        decelerationRate="fast"
      >
        {tools.map((tool) => (
          <GlowCard
            key={tool.title}
            title={tool.title}
            subtitle={tool.subtitle}
            shape={tool.shape}
            onPress={tool.onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const quizName = useOnboardingStore((s) => s.quizAnswers.name);
  const targetHoursRaw = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const targetHours = typeof targetHoursRaw === 'number' && targetHoursRaw > 0 ? targetHoursRaw : 4;

  const streak = useProfileStatsStore((s) => s.streak) ?? 0;
  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const sessions = useSessionStore((s) => s.sessions);
  const tasks = useTaskStore((s) => s.tasks);
  const openTasks = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);
  const earnedCrystals = useCrystalStore((s) => s.earnedCrystals.length);
  const rank = useLeaderboardStore((s) => s.currentUserRank);
  const recordings = useVideoGalleryStore((s) => s.recordings.length);

  const isFullyUnlocked = useAppLockStore((s) => s.isFullyUnlocked);
  const isCurrentlyLocked = useAppLockStore((s) => s.isCurrentlyLocked);
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());
  const canClaim = !isFullyUnlocked && availableScreenTime >= 60;
  const [showClaimModal, setShowClaimModal] = useState(false);

  const rightEyeOpen = useSharedValue(1);

  // Light status bar text everywhere else in the app; dark on this light header
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => setStatusBarStyle('light');
    }, [])
  );

  // Rank for the Ranks card; the leaderboard screen refreshes it in full
  useEffect(() => {
    const { lastFetched, fetchLeaderboard } = useLeaderboardStore.getState();
    if (user?.id && !lastFetched) fetchLeaderboard(user.id);
  }, [user?.id]);

  // Focus minutes per local day, from the same session data as analytics
  const minutesByDay = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of sessions) {
      totals.set(s.date, (totals.get(s.date) ?? 0) + (s.total_locked_in_seconds || 0));
    }
    return (daysAgo: number) => (totals.get(getLocalDateStringDaysAgo(daysAgo)) ?? 0) / 60;
  }, [sessions]);
  const weekMinutes = [6, 5, 4, 3, 2, 1, 0].map(minutesByDay);

  // Flash the level-up toast when the user crosses into a new level
  const currentLevel = useMemo(
    () => levelFromXP(computeXP({ totalHours, totalGrinds: grinds })),
    [totalHours, grinds]
  );
  const lastLevelRef = useRef<number | null>(null);
  const [toastLevel, setToastLevel] = useState<number | null>(null);
  useEffect(() => {
    if (lastLevelRef.current === null) {
      lastLevelRef.current = currentLevel;
      return;
    }
    if (currentLevel > lastLevelRef.current) {
      setToastLevel(currentLevel);
    }
    lastLevelRef.current = currentLevel;
  }, [currentLevel]);

  const firstName =
    quizName?.trim() || user?.user_metadata?.full_name?.split(' ')[0] || 'friend';

  const winkMascot = () => {
    mascotWink();
    rightEyeOpen.value = withSequence(
      withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }),
      withTiming(0, { duration: 90 }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
    );
  };

  const blockedSubtitle = isFullyUnlocked
    ? 'Unlocked today'
    : isCurrentlyLocked
      ? 'Locked'
      : 'Screen time on';

  const lockInTools: Tool[] = [
    { title: 'Timelapse', subtitle: 'Camera on', shape: 'wave', onPress: () => router.push('/record' as any) },
    { title: 'Stopwatch', subtitle: 'No camera', shape: 'orb', onPress: () => router.push('/stopwatch' as any) },
    ...(Platform.OS === 'ios'
      ? [{ title: 'Blocked Apps', subtitle: blockedSubtitle, shape: 'crown' as const, onPress: () => router.push('/blocked-apps' as any) }]
      : []),
    {
      title: 'Tasks',
      subtitle: openTasks.length > 0 ? `${openTasks.length} to do` : 'All clear',
      shape: 'ripple',
      onPress: () => router.push('/tasks' as any),
    },
  ];

  const progressTools: Tool[] = [
    {
      title: 'Trophies',
      subtitle: `${earnedCrystals} / ${CRYSTALS.length} earned`,
      shape: 'peak',
      onPress: () => router.push({ pathname: '/profile', params: { tab: 'medals' } } as any),
    },
    { title: 'Ranks', subtitle: rank ? `You're #${rank}` : 'Leaderboard', shape: 'crown', onPress: () => router.push('/leaderboard' as any) },
    { title: 'Stats', subtitle: `Level ${currentLevel}`, shape: 'wave', onPress: () => router.push('/analytics' as any) },
    { title: 'Timelapses', subtitle: `${recordings} recorded`, shape: 'orb', onPress: () => router.push('/profile' as any) },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Light fill above the top edge when pulling down */}
        <View style={styles.overscrollFill} />

        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => {
                buttonPress();
                router.push('/settings-page');
              }}
              style={styles.menuButton}
              hitSlop={8}
            >
              <View style={styles.menuLineLong} />
              <View style={styles.menuLineShort} />
            </Pressable>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Pressable onPress={winkMascot} hitSlop={8} accessibilityLabel="Lockin Club mascot">
              <Mascot size={44} rightEyeOpen={rightEyeOpen} />
            </Pressable>
          </View>

          {/* Hero: greeting + last four days */}
          <View style={styles.hero}>
            <Svg style={styles.heroGlow} width={260} height={260}>
              <Defs>
                <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={ORANGE} stopOpacity={0.28} />
                  <Stop offset="0.6" stopColor={BrandColors.palette.yellow} stopOpacity={0.12} />
                  <Stop offset="1" stopColor={BrandColors.palette.yellow} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={130} cy={130} r={130} fill="url(#heroGlow)" />
            </Svg>

            <View style={styles.greeting}>
              <Text style={styles.greetingSmall}>{greetingForNow()},</Text>
              <Text style={styles.greetingName} numberOfLines={1} adjustsFontSizeToFit>
                {firstName}
              </Text>
              <Text style={styles.greetingLine}>
                It's time to <Text style={styles.greetingAccent}>lock in.</Text>
              </Text>
            </View>

            <View style={styles.dayGrid}>
              <View style={styles.dayRow}>
                <DayCell daysAgo={3} minutes={minutesByDay(3)} />
                <DayCell daysAgo={2} minutes={minutesByDay(2)} />
              </View>
              <View style={styles.dayRow}>
                <DayCell daysAgo={1} minutes={minutesByDay(1)} />
                <DayCell daysAgo={0} minutes={minutesByDay(0)} />
              </View>
            </View>
          </View>

          <FocusTodayCard
            todayMinutes={minutesByDay(0)}
            targetHours={targetHours}
            weekMinutes={weekMinutes}
            streak={streak}
          />

          {/* Earned screen time, ready to spend */}
          {canClaim && (
            <Pressable
              onPress={() => {
                buttonPress();
                setShowClaimModal(true);
              }}
              style={({ pressed }) => [styles.claim, pressed && styles.claimPressed]}
            >
              <Ionicons name="hourglass" size={18} color={BrandColors.palette.white} />
              <Text style={styles.claimText}>
                Claim {formatMinutes(availableScreenTime)} of screen time
              </Text>
              <Ionicons name="chevron-forward" size={16} color={BrandColors.palette.white} />
            </Pressable>
          )}
        </View>

        {/* Dark tools section */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.notch}>
            <Ionicons name="chevron-up" size={16} color={INK} />
          </View>

          {openTasks[0] && (
            <Pressable onPress={() => router.push('/tasks' as any)} style={styles.nextTask}>
              <Text style={styles.nextTaskLabel}>NEXT UP</Text>
              <Text style={styles.nextTaskTitle} numberOfLines={1}>
                {openTasks[0].title}
              </Text>
            </Pressable>
          )}

          <ToolRow title="Lock in" tools={lockInTools} />
          <ToolRow title="Progress" tools={progressTools} />
        </View>
      </ScrollView>

      <ClaimScreenTimeModal
        visible={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        source="dashboard"
      />
      <LevelUpToast level={toastLevel} onDismiss={() => setToastLevel(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: INK,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overscrollFill: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: LIGHT,
  },
  top: {
    backgroundColor: LIGHT,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
    paddingLeft: 22,
    paddingRight: 12,
    borderRadius: 34,
    backgroundColor: BrandColors.palette.white,
    shadowColor: INK,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    gap: 6,
  },
  menuLineLong: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: INK,
  },
  menuLineShort: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: INK,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.medium,
    color: INK,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 6,
  },
  heroGlow: {
    position: 'absolute',
    left: -90,
    top: -30,
  },
  greeting: {
    flex: 1,
    paddingRight: 12,
  },
  greetingSmall: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: 'rgba(14, 14, 14, 0.5)',
  },
  greetingName: {
    fontSize: 40,
    fontFamily: Fonts.semiBold,
    color: INK,
    marginTop: 2,
  },
  greetingLine: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(14, 14, 14, 0.7)',
    marginTop: 10,
  },
  greetingAccent: {
    fontFamily: Fonts.bold,
    color: ORANGE,
  },
  dayGrid: {
    gap: 22,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 22,
  },
  dayCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNumber: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: Fonts.light,
    color: 'rgba(14, 14, 14, 0.35)',
    textAlign: 'center',
  },
  dayNumberToday: {
    fontFamily: Fonts.regular,
    color: INK,
  },
  dayName: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(14, 14, 14, 0.35)',
    textAlign: 'center',
  },
  dayNameToday: {
    color: INK,
  },
  dots: {
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotEmpty: {
    backgroundColor: 'rgba(14, 14, 14, 0.15)',
  },
  claim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: ORANGE,
  },
  claimPressed: {
    opacity: 0.85,
  },
  claimText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: BrandColors.palette.white,
  },
  bottom: {
    flexGrow: 1,
    backgroundColor: INK,
    paddingTop: 22,
  },
  notch: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    width: 84,
    height: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTask: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  nextTaskLabel: {
    fontSize: 11,
    fontFamily: Fonts.monoSemiBold,
    letterSpacing: 1.5,
    color: ORANGE,
  },
  nextTaskTitle: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
  },
  toolSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Fonts.medium,
    color: BrandColors.palette.white,
    paddingHorizontal: 22,
    marginTop: 10,
    marginBottom: 16,
  },
  cards: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
