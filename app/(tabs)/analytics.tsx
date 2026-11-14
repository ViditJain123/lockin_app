import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HourlyFocus from '@/components/analytics/HourlyFocus';
import DitherWeekChart, { ChartLegend } from '@/components/charts/DitherWeekChart';
import { LCBackButton } from '@/components/lc';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, RADIUS, T } from '@/constants/Theme';
import ThermalHeatmap, { HeatLegend } from '@/components/charts/ThermalHeatmap';
import { useFocusByDate, useRhythmSessions, useThisWeek } from '@/lib/focusData';
import { useOnboardingStore } from '@/store/useOnboardingStore';

// The tape: this week only — lock-in vs screen time, and when you focus.

function formatHoursColon(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatMinutesShort(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
  return formatHoursColon(totalMinutes / 60);
}

// ─── Primitives ────────────────────────────────────────────────────────────

type Kpi = { label: string; value: string; unit?: string };

function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <View style={strip.row}>
      {kpis.map((k) => (
        <View key={k.label} style={strip.cell}>
          <Text style={strip.label}>{k.label}</Text>
          <Text style={strip.value}>{k.value}</Text>
          {k.unit ? <Text style={strip.unit}>{k.unit}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const strip = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cell: {
    flex: 1,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.card,
    ...cardShadow,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 28,
    color: T.ink,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  unit: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: T.inkSoft,
    letterSpacing: 1,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});

function LCCard({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[card.wrap, style]}>
      {(title || right) && (
        <View style={card.header}>
          {title ? <Text style={card.eyebrow}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    backgroundColor: T.card,
    ...cardShadow,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
});

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { days, todayIndex } = useThisWeek();
  const rhythmSessions = useRhythmSessions(7);
  const focusByDate = useFocusByDate();
  const activeDays = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 26 * 7);
    return Object.entries(focusByDate).filter(([d, m]) => m >= 1 && new Date(d + 'T12:00:00') >= cutoff).length;
  }, [focusByDate]);
  const targetHours = useOnboardingStore((s) => s.quizAnswers.targetHours) || 4;

  const lockedIn = days.reduce((a, d) => a + d.focusMin, 0);
  const screen = days.reduce((a, d) => a + d.screenMin, 0);
  const net = lockedIn - screen;
  const goalDays = days.filter((d) => d.focusMin >= targetHours * 60).length;
  const best = days.reduce((m, d, i) => (d.focusMin > days[m].focusMin ? i : m), 0);
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const kpis: Kpi[] = [
    { label: 'LOCKED IN', value: formatMinutesShort(lockedIn) },
    { label: 'SCREEN TIME', value: formatMinutesShort(screen) },
    { label: 'GOAL DAYS', value: `${goalDays}/${todayIndex + 1}` },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <LCBackButton />
        <Text style={styles.eyebrow}>THIS WEEK</Text>
        <Text style={styles.title}>The tape.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <KpiStrip kpis={kpis} />

        <LCCard style={styles.sectionGap}>
          <View style={styles.chartHead}>
            <View>
              <Text style={styles.netLabel}>{net >= 0 ? 'Net focus' : 'Net scroll'}</Text>
              <Text style={[styles.netValue, { color: net >= 0 ? T.yellow : T.orange }]}>
                {net >= 0 ? '+' : '−'}
                {formatMinutesShort(Math.abs(net))}
              </Text>
            </View>
            <ChartLegend />
          </View>
          <DitherWeekChart days={days} todayIndex={todayIndex} height={240} px={4} />
          {lockedIn > 0 && (
            <Text style={styles.insight}>
              Best day: <Text style={styles.insightStrong}>{DAY_NAMES[best]}</Text> · {formatMinutesShort(days[best].focusMin)} locked in
            </Text>
          )}
        </LCCard>

        <LCCard style={styles.sectionGap}>
          <HourlyFocus sessions={rhythmSessions} />
        </LCCard>

        <LCCard style={styles.sectionGap}>
          <View style={styles.chartHead}>
            <View>
              <Text style={styles.netLabel}>Last 6 months</Text>
              <Text style={styles.heatTitle}>{activeDays} days locked in</Text>
            </View>
            <HeatLegend />
          </View>
          <ThermalHeatmap minutesByDate={focusByDate} weeks={26} gap={2.5} />
        </LCCard>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chartHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  netLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
  netValue: {
    fontFamily: Fonts.display,
    fontSize: 40,
    lineHeight: 44,
  },
  heatTitle: {
    marginTop: 4,
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: T.ink,
  },
  insight: {
    marginTop: 12,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkSoft,
  },
  insightStrong: {
    fontFamily: Fonts.bold,
    color: T.ink,
  },
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: T.orange,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: T.ink,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: T.sunk,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabBtnActive: {
    backgroundColor: T.card,
    ...cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tabText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: T.ink,
    fontFamily: Fonts.monoSemiBold,
  },
  // Period nav
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  periodArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.card,
    ...cardShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  periodLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: T.inkSoft,
    textTransform: 'uppercase',
    minWidth: 140,
    textAlign: 'center',
  },
  // Cards
  sectionGap: {
    marginTop: 14,
  },
  cardAccent: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 22,
    color: T.orange,
    letterSpacing: 0.5,
  },
});
