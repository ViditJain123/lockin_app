import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { getLocalDateString } from '@/lib/dateUtils';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTaskStore } from '@/store/useTaskStore';

// ─── Tiny SVG icons ────────────────────────────────────────────────────────

function RingClockIcon({ size = 54 }: { size?: number }) {
  const cx = size / 2;
  const r = size * 0.39;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cx} r={r} stroke={LC.border} strokeWidth={1} fill="none" />
      <Circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={LC.red}
        strokeWidth={2}
        strokeDasharray={2 * Math.PI * r}
        strokeDashoffset={2 * Math.PI * r * 0.62}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r1 = r + 1;
        const r2 = r + 3;
        return (
          <Line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cx + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cx + Math.sin(a) * r2}
            stroke={LC.textDim}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}

function ChevronRightIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={LC.textDim}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckSquareIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M1 1h10v10H1z"
        stroke={LC.red}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M3 6l2 2 4-4"
        stroke={LC.red}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({ size = 30 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 10 10">
        <Path d="M1 1l8 4-8 4V1z" fill={LC.red} />
      </Svg>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatHoursColon(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00';
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    // Float imprecision can push ~0.9999 hours to round to 60 minutes;
    // carry the hour so we don't display "3:60" instead of "4:00".
    h += 1;
    m = 0;
  }
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatHoursLeft(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00';
  return formatHoursColon(hours);
}

// ─── Screen ───────────────────────────────────────────────────────────────

export default function LockInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const streak = useProfileStatsStore((s) => s.streak);
  const hasHydrated = useProfileStatsStore((s) => s.hasHydrated);

  const targetHoursRaw = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const targetHours = typeof targetHoursRaw === 'number' && targetHoursRaw > 0 ? targetHoursRaw : 0;

  const sessions = useSessionStore((s) => s.sessions);
  const todayHours = useMemo(() => {
    const today = getLocalDateString();
    const todaySec = sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.total_locked_in_seconds || 0), 0);
    return todaySec / 3600;
  }, [sessions]);

  const targetPct =
    targetHours > 0 ? Math.min(todayHours / targetHours, 1) : 0;
  const hoursLeft = Math.max(targetHours - todayHours, 0);

  const nextTask = useTaskStore((s) =>
    s.tasks.find((t) => !t.isCompleted),
  );

  const goTimelapse = () => router.push('/record' as any);
  const goStopwatch = () => router.push('/stopwatch' as any);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Ambient red glow */}
      <View pointerEvents="none" style={styles.ambientGlow} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top row — logo + streak chip */}
        <View style={styles.topRow}>
          <Text style={styles.brandMark}>
            LOCKIN<Text style={styles.brandMarkAccent}>CLUB</Text>
          </Text>
          {hasHydrated && streak != null && streak > 0 ? (
            <View style={styles.streakChip}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{streak} DAY</Text>
            </View>
          ) : null}
        </View>

        {/* Banner */}
        <View style={styles.bannerBlock}>
          <Text style={styles.bannerEyebrow}>◆ PICK YOUR WEAPON</Text>
          <Text style={styles.bannerTitle}>
            HOW WILL{'\n'}YOU <Text style={styles.bannerTitleAccent}>LOCK IN?</Text>
          </Text>
        </View>

        {/* Today's target mini-status */}
        {targetHours > 0 ? (
          <View style={styles.targetCard}>
            <View style={styles.targetCardRow}>
              <Text style={styles.targetCardEyebrow}>
                TODAY · TARGET {targetHours}H
              </Text>
              <Text style={styles.targetCardSubText}>
                {formatHoursLeft(hoursLeft)} LEFT
              </Text>
            </View>
            <View style={styles.targetCardProgressRow}>
              <Text style={styles.targetCardHours}>{formatHoursColon(todayHours)}</Text>
              <View style={styles.targetCardTrack}>
                <View
                  style={[
                    styles.targetCardFill,
                    { width: `${Math.round(targetPct * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* Hero — TIMELAPSE card */}
        <Pressable onPress={goTimelapse} style={styles.heroWrap}>
          <View style={styles.heroCard}>
            {/* Warm lit background gradient (layered Views) */}
            <View style={styles.heroGlow1} pointerEvents="none" />
            <View style={styles.heroGlow2} pointerEvents="none" />

            {/* Rule-of-thirds lines */}
            {[0.33, 0.66].map((p) => (
              <View
                key={`h${p}`}
                pointerEvents="none"
                style={[styles.ruleH, { top: `${p * 100}%` }]}
              />
            ))}
            {[0.33, 0.66].map((p) => (
              <View
                key={`v${p}`}
                pointerEvents="none"
                style={[styles.ruleV, { left: `${p * 100}%` }]}
              />
            ))}

            {/* RECOMMENDED flag */}
            <View style={styles.recommendedFlag}>
              <Text style={styles.recommendedText}>★ RECOMMENDED</Text>
            </View>

            {/* Adaptive badge (replaces 120×) */}
            <View style={styles.adaptiveBadge}>
              <View style={styles.adaptiveDot} />
              <Text style={styles.adaptiveText}>ADAPTIVE</Text>
            </View>

            {/* Content */}
            <View style={styles.heroContent}>
              <Text style={styles.heroWatermark}>01</Text>
              <Text style={styles.heroEyebrow}>MODE 01</Text>
              <Text style={styles.heroTitle}>
                TIMELAPSE{'\n'}
                <Text style={styles.heroTitleAccent}>GRIND</Text>
              </Text>
              <Text style={styles.heroDesc}>
                Camera rolls. Share-ready timelapses you can flex on the leaderboard.
              </Text>

              {/* CTA */}
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaLabel}>START RECORDING</Text>
                <PlayIcon size={30} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>OR KEEP IT LOWKEY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Secondary — STOPWATCH card */}
        <Pressable onPress={goStopwatch} style={styles.secondaryWrap}>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryIconWrap}>
              <RingClockIcon size={54} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.secondaryEyebrowRow}>
                <Text style={styles.secondaryEyebrow}>MODE 02</Text>
                <View style={styles.secondaryEyebrowDot} />
                <Text style={styles.secondaryEyebrow}>NO CAMERA</Text>
              </View>
              <Text style={styles.secondaryTitle}>STOPWATCH GRIND</Text>
              <Text style={styles.secondaryDesc}>
                Just a timer. Same 1:1 reward. No video.
              </Text>
            </View>
            <ChevronRightIcon size={18} />
          </View>
        </Pressable>

        {/* Next task pill */}
        {nextTask ? (
          <View style={styles.nextTaskWrap}>
            <View style={styles.nextTaskPill}>
              <View style={styles.nextTaskIconBox}>
                <CheckSquareIcon size={12} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.nextTaskEyebrow}>NEXT UP</Text>
                <Text style={styles.nextTaskTitle} numberOfLines={1}>
                  {nextTask.title}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(255,59,48,0.08)',
    opacity: 0.9,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  // Top row
  topRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    fontFamily: Fonts.monoBold,
    fontSize: 20,
    letterSpacing: 3,
    color: LC.text,
    textTransform: 'uppercase',
  },
  brandMarkAccent: {
    color: LC.red,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: LC.red,
    letterSpacing: 1,
  },
  // Banner
  bannerBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  bannerEyebrow: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    letterSpacing: 3,
    color: LC.red,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontFamily: Fonts.display,
    fontSize: 48,
    lineHeight: 56,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 6,
    includeFontPadding: false,
  },
  bannerTitleAccent: {
    color: LC.red,
  },
  // Target card
  targetCard: {
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    marginBottom: 14,
  },
  targetCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  targetCardEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  targetCardSubText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: LC.textDim,
    letterSpacing: 0.5,
  },
  targetCardProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  targetCardHours: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: LC.text,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  targetCardTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  targetCardFill: {
    height: '100%',
    backgroundColor: LC.red,
  },
  // Hero card
  heroWrap: {
    paddingHorizontal: 16,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: '#1a1210',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 8,
  },
  heroGlow1: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(180,110,60,0.25)',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  ruleH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ruleV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  recommendedFlag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: LC.red,
    zIndex: 2,
  },
  recommendedText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 1.5,
  },
  adaptiveBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.4)',
    zIndex: 2,
  },
  adaptiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LC.red,
    shadowColor: LC.red,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  adaptiveText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: LC.red,
    letterSpacing: 1.5,
  },
  heroContent: {
    position: 'relative',
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroWatermark: {
    position: 'absolute',
    right: 12,
    top: 28,
    fontFamily: Fonts.display,
    fontSize: 140,
    lineHeight: 120,
    color: 'rgba(255,59,48,0.08)',
    letterSpacing: -4,
  },
  heroEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 44,
    lineHeight: 52,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 4,
    includeFontPadding: false,
  },
  heroTitleAccent: {
    color: LC.red,
  },
  heroDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 10,
    lineHeight: 17,
    maxWidth: 260,
  },
  heroCta: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: LC.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCtaLabel: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 2,
    color: '#fff',
    includeFontPadding: false,
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LC.border,
  },
  dividerLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  // Secondary card
  secondaryWrap: {
    paddingHorizontal: 16,
  },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  secondaryIconWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  secondaryEyebrowDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: LC.textMute,
  },
  secondaryTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 2,
    includeFontPadding: false,
  },
  secondaryDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 4,
    lineHeight: 16,
  },
  // Next task pill
  nextTaskWrap: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  nextTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: LC.borderStrong,
  },
  nextTaskIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTaskEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  nextTaskTitle: {
    fontFamily: Fonts.interMedium,
    fontSize: 13,
    color: LC.text,
    marginTop: 2,
  },
});
